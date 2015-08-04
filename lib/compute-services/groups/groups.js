
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var _ = require('./../../core/underscore.js');
var GroupCriteria = require("./domain/group-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/search/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');
var BillingStatsConverter = require('./../statistics/domain/billing-stats-converter.js');
var MonitoringStatsConverter = require('./../statistics/domain/monitoring-stats-converter.js');

var GroupMetadata = require('./domain/group-metadata.js');


module.exports = Groups;

/**
 * Service that allow to manage groups in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param groupClient
 * @param queueClient
 * @constructor
 */
function Groups(dataCenterService, groupClient, queueClient, accountClient) {
    var self = this;

    var billingStatsConverter = new BillingStatsConverter();

    self._serverService = function(serverService) {
        self.serverService = serverService;
    };

    function init () {
        SearchSupport.call(self);
    }

    function resolveParentGroup(command) {
        return command.parentGroupId && command ||
            !command.parentGroup && command ||
            self
                .findSingle(command.parentGroup)
                .then(function (data) {
                    delete command.parentGroup;
                    return _.extend(command, {parentGroupId: data.id});
                });
    }

    function resolveCustomFields(command) {
        if (command.customFields) {
            return accountClient.getCustomFields()
                .then(_.partial(filterCustomFields, command))
                .then(_.partial(composeCustomFields, command));
        }

        return command;
    }

    function filterCustomFields(command, availableFields) {
        var filteredFields = _.map(command.customFields, function(criteria) {
                var byName = _.filter(availableFields, function(field) {
                    return field.name === criteria.name;
                });
                var byFunction = criteria.where ? _.filter(availableFields, criteria.where) : [];
                return _.asArray(byName, byFunction);
            }
        );
        return _.chain(filteredFields)
            .flatten()
            .uniq(function(field) {
                return field.id;
            })
            .value();
    }

    function composeCustomFields(command, filteredFields) {
        command.customFields = _.map(filteredFields, function(field) {
            return {
                id: field.id,
                value: _.find(command.customFields, function(criteria) {
                    return criteria.name === field.name || criteria.where(field);
                }).value
            };
        });
        return command;
    }

    /**
     * Method allow to create group
     *
     * @param {object} command
     * @param {GroupCriteria} command.parentGroup - GroupSearchCriteria that specify one single target group
     * @param {string} command.name - target group name
     * @param {string} command.description - target group description
     * @param {Array<CustomField>} command.customFields - the list with custom fields {name, where}
     *
     * @instance
     * @function create
     * @memberof Groups
     */
    self.create = function (command) {
        var result = Promise
            .resolve(command)
            .then(resolveParentGroup)
            .then(resolveCustomFields)
            .then(groupClient.createGroup);

        return new NoWaitOperationPromise(queueClient, processedGroupRef, "Create Group").from(result);
    };

    function deleteGroup (groupMetadata) {
        return groupClient
            .deleteGroup(groupMetadata.id)
            .then(function (jobInfo) {
                jobInfo.groupId = groupMetadata.id;
                return jobInfo;
            });
    }

    /**
     * Method allow to delete group of servers
     * @param groupCriteria
     *
     * @returns {OperationPromise}
     *
     * @instance
     * @function delete
     * @memberof Groups
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (groups) {
                return Promise.settle(_.map(groups, deleteGroup));
            });

        return new OperationPromise(queueClient, createListOfGroupRefs, "Delete Group").fromInspections(result);
    };

    function createListOfGroupRefs(jobInfoList) {
        return jobInfoList.map(function (curInfo) {
            return { id: curInfo.groupId };
        });
    }

    function processedGroupRef(response) {
        return { id: response.id };
    }

    self._findByRef = function (groupRef, includeServerDetails) {
        return groupClient
            .findGroupById(groupRef.id ? groupRef.id : groupRef, includeServerDetails)
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    function modifySingle(modificationConfig, groupId) {
        return Promise
            .props({
                operation: groupClient.modifyGroup(groupId, modificationConfig),
                id: groupId
            })
            .then(processedGroupRef);
    }

    function mapGroupId (groups) {
        return groups.map(_.property('id'));
    }

    function resolveParentGroupId(modificationConfig) {
        return Promise
            .resolve(modificationConfig)
            .then(resolveParentGroup);
    }

    function findTargetGroupIds(criteria) {
        return self
            .find(criteria)
            .then(mapGroupId);
    }

    /**
     * Method allow to modify group resource settings
     *
     * @param {GroupSearchCriteria} groupCriteria - criteria that specify set of groups that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new group name
     * @param {string} modificationConfig.description - new value of group description
     * @param {GroupSearchCriteria} modificationConfig.parentGroup - reference to group that will be set as parent
     *                              of current group
     * @param {Array<CustomField>} modificationConfig.customFields - target entity custom fields
     * @return {Promise<GroupSearchCriteria[]>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Groups
     */
    self.modify = function (groupCriteria, modificationConfig) {
        var criteria = self._searchCriteriaFrom(groupCriteria);

        return Promise
            .all([
                resolveParentGroupId(modificationConfig)
                .then(resolveCustomFields),
                findTargetGroupIds(criteria)
            ])
            .then(function (results) {
                var ids = results[1];
                var groupDiff = results[0];
                var modifyGroupById = _.partial(modifySingle, groupDiff);

                return ids.map(modifyGroupById);
            })
            .then(Promise.all);
    };

    /**
     * Method allows to search groups.
     *
     * @param {GroupCriteria} args - criteria that specify set of groups that will be searched
     *
     * @return {Promise<Array<GroupMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Groups
     */
    self.find = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        var filteredByDataCenterPromise;
        if (!dataCenterCriteria) {
            filteredByDataCenterPromise = Promise.resolve([]);
        } else {
            filteredByDataCenterPromise = dataCenterService.find(dataCenterCriteria)
                .then(loadRootGroups);
        }

        return filteredByDataCenterPromise
            .then(_.partial(loadGroupsById, criteria))
            .then(_.flatten)
            .then(loadDataCenterToGroups)
            .then(addDataCenterToGroups)
            .then(_.partial(_.applyMixin, GroupMetadata))
            .then(collectAllGroups)
            .then(_.partial(filterGroups, criteria))
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    function loadRootGroups(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return self.findSingle({id: dataCenter.getGroupId()});
            })
        );
    }

    function loadGroupsById(criteria, rootGroups) {
        var allIds = new Criteria(criteria).extractIdsFromCriteria();
        if (!_.isEmpty(allIds)) {
            return Promise.join(
                Promise.all(
                    _.map(_.asArray(allIds), function(groupId) {
                        return self._findByRef({id: groupId});
                    })),
                rootGroups
            );
        } else {
            return rootGroups;
        }
    }

    function loadDataCenterToGroups(groups) {
        return Promise.all(_.map(groups, function(group) {
            return Promise.props({
                group: group,
                dataCenter: dataCenterService.findSingle({id: group.locationId.toLowerCase()})
            });
        }));
    }

    function addDataCenterToGroups(enhancedGroups) {
        return _.map(enhancedGroups, function(prop) {
            prop.group.dataCenter = prop.dataCenter;
            return prop.group;
        });
    }

    function collectAllGroups(groups) {
        return _.chain(_.map(
            groups,
            function(group) {
                return group.getAllGroups();
            }))
            .flatten()
            .uniq(_.property('id'))
            .flatten()
            .value();
    }

    function filterGroups(criteria, groups) {

        if (!groups || groups.length === 0) {
            return [];
        }
        return _.filter(groups, new GroupCriteria(criteria).predicate().fn);
    }

    /**
     * Power on servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be started
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function powerOn
     */
    self.powerOn = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().powerOn({group: criteria});
    };

    /**
     * Power off servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be stopped
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function powerOff
     */
    self.powerOff = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().powerOff({group: criteria});
    };

    /**
     * Pause servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be paused
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function pause
     */
    self.pause = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().pause({group: criteria});
    };

    /**
     * Start maintenance servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function startMaintenance
     */
    self.startMaintenance = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().startMaintenance({group: criteria});
    };

    /**
     * Stop maintenance servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function stopMaintenance
     */
    self.stopMaintenance = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().stopMaintenance({group: criteria});
    };

    /**
     * Shut down servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function shutDown
     */
    self.shutDown = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().shutDown({group: criteria});
    };

    /**
     * Reboot servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function reboot
     */
    self.reboot = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().reboot({group: criteria});
    };

    /**
     * Reset servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function reset
     */
    self.reset = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().reset({group: criteria});
    };

    /**
     * Archive servers.
     * @param {GroupCriteria} args - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function archive
     */
    self.archive = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).parseDataCenterCriteria();

        return self.serverService().archive({group: criteria});
    };

    /**
     * Restore servers to group.
     * @param {ServerCriteria} groupServerCriteria - criteria that specify set of groups with servers that will be restored
     * @param {GroupCriteria} targetGroupCriteria - criteria that specify group, in that will be servers restored
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function restore
     */
    self.restore = function(groupServerCriteria, targetGroupCriteria) {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(groupServerCriteria)).parseDataCenterCriteria();

        return self.serverService().restore({group: criteria}, targetGroupCriteria);
    };

    /**
     * Define infrastructure with servers and groups.
     * @param {InfrastructureConfig} infraStructureConfig - the config of infrastructure
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function defineInfrastructure
     */
    self.defineInfrastructure = function(infraStructureConfig) {
        return self.defineGroupHierarchy(infraStructureConfig.dataCenter, infraStructureConfig)
            .then(_.flatten)
            .then(_.uniq);
    };

    function extractGroupIds(config) {
        return _.asArray(config.groupId, _.map(config.subItems, extractGroupIds));
    }

    /**
     * Define group hierarchy with servers in data centers, specified by dataCenterCriteria.
     * @param {DataCenterCriteria} dataCenterCriteria - criteria that specify set of data centers
     * @param {GroupConfig} hierarchyConfig - the config of hierarchy
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function defineGroupHierarchy
     */
    self.defineGroupHierarchy = function(dataCenterCriteria, hierarchyConfig) {
        return dataCenterService.find(dataCenterCriteria)
            .then(function(dataCenters) {
                return Promise.all(_.map(dataCenters, _.partial(createHierarchy, hierarchyConfig)));
            })
            .then(_.partial(_.map, _, extractGroupIds));
    };

    /**
     * Get billing stats by groups.
     * @param {GroupCriteria} arguments - criteria that specify set of groups that will be searched
     * @returns {Promise} - promise that resolved by list of BillingStats.
     *
     * @instance
     * @function getBillingStats
     * @memberof Groups
     */
    self.getBillingStats = function() {
        return self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (groups) {
                return Promise.all(_.map(groups, getGroupBillingStats));
            });
    };

    function getGroupBillingStats(group) {
        return groupClient
            .getGroupBillingStats(group.id)
            .then(billingStatsConverter.convertClientResponse);
    }

    /**
     * Get monitoring stats by groups.
     * @param {GroupCriteria} groupCriteria - group search criteria
     * @param {Object} filter - monitoring filter
     * @example filter
     * {
     *     start: '2015-04-05T16:00:00',
     *     end: '2015-04-05T22:00:00',
     *     sampleInterval: '02:00:00',
     *     type: MonitoringStatsType.HOURLY,
     * }
     *
     * @returns {Promise} - promise that resolved by list of MonitoringStats.
     *
     * @instance
     * @function getMonitoringStats
     * @memberof Groups
     */
    self.getMonitoringStats = function(groupCriteria, filter) {
        var converter = new MonitoringStatsConverter();

        return self
            .find(self._searchCriteriaFrom(groupCriteria))
            .then(function (groups) {
                return Promise.all(_.map(groups, _.partial(getGroupMonitoringStats, filter, converter)));
            });
    };

    function getGroupMonitoringStats(filter, converter, group) {
        var request = converter.validateAndConvert(filter);

        return Promise.props({
            group: group,
            servers: groupClient.getGroupMonitoringStats(group.id, request)
        });
    }

    function createHierarchy(config, parentGroupId, dataCenter) {
        //on first iteration it will be dataCenter
        if (parentGroupId instanceof Object) {
            dataCenter = parentGroupId;
            parentGroupId = parentGroupId.getGroupId();
        }
        if (!isServerConfig(config)) {
            var groupConfig = config.group instanceof Object ? config.group : {name: config.group};
            return createGroup(groupConfig, parentGroupId)
                .then(function(groupMetadata) {
                    config.groupId = groupMetadata.id;
                })
                .then(function() {
                    var createHierarchyFn = _.partial(createHierarchy, _, config.groupId, dataCenter);
                    return Promise.all(_.map(config.subItems, createHierarchyFn));
                })
                .then(_.partial(Promise.resolve, config));
        } else {
            var serverConfig = _.extend(config, {groupId: parentGroupId});

            if (serverConfig.template) {
                serverConfig.template.dataCenter = dataCenter;
            }

            var count = serverConfig.count || 1;

            return Promise.all(_.times(count, _.partial(createServer, serverConfig)));
        }
    }

    function createGroup(config, parentGroupId) {
        return self.create(_.omit(_.extend(config, {parentGroupId: parentGroupId}), "subItems", "dataCenter"));
    }

    function createServer(serverConfig) {
        return self.serverService().create(_.omit(serverConfig, "count"))
            .then(_.partial(Promise.resolve, serverConfig));
    }

    function isServerConfig(config) {
        return config.group === undefined;
    }

    init();
}