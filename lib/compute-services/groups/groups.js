
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var _ = require('./../../core/underscore.js');
var GroupCriteria = require("./domain/group-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/search/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

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
function Groups(dataCenterService, groupClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    self.findByNameAndDatacenter = function(criteria) {
        return dataCenterService.findSingle(criteria.dataCenter)
            .then(function(dataCenter) {
                return _.applyMixin(DataCenterMetadata, dataCenter).getGroupId();
            })
            .then(function(groupId) {
                return self.findSingle({id: groupId});
            })
            .then(function(group) {
                return _.findWhere(group.groups, {name: criteria.name});
            })
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    function resolveParentGroup(command) {
        return !command.parentGroup && command ||
            self
                .findSingle(command.parentGroup)
                .then(function (data) {
                    return _.extend(command, {parentGroupId: data.id});
                });
    }

    /**
     * Method allow to create group
     *
     * @param {object} command
     * @param {GroupCriteria} command.parentGroup - GroupSearchCriteria that specify one single target group
     * @param {string} command.name - target group name
     * @param {string} command.description - target group description
     *
     * @memberof Groups
     */
    self.create = function (command) {
        var result = Promise
            .resolve(command)
            .then(resolveParentGroup)
            .then(groupClient.createGroup);

        return new NoWaitOperationPromise(queueClient, processedGroupRef).from(result);
    };

    function deleteGroup (groupMetadata) {
        return groupClient
            .deleteGroup(groupMetadata.id)
            .then(_.constant(processedGroupRef(groupMetadata)));
    }

    /**
     * Method allow to delete group of servers
     * @param groupCriteria
     *
     * @returns {OperationPromise}
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (groups) {
                return Promise.all(_.map(groups, deleteGroup));
            });

        return new OperationPromise(queueClient, result).from(result);
    };

    function processedGroupRef(response) {
        return { id: response.id };
    }

    self.findByRef = function (groupRef, includeServerDetails) {
        return groupClient
            .findGroupById(groupRef.id ? groupRef.id : groupRef, includeServerDetails)
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    self.modify = function (groupCriteria, modificationConfig) {
        var criteria = self._searchCriteriaFrom(groupCriteria);

        return self
            .find(criteria)
            .then(function (groups) {
                return _.map(groups, _.property('id'));
            })
            .then(function (ids) {
                return Promise.all(_.map(ids, function (curGroupId) {
                    return Promise.props({
                        operation: groupClient.changeGroupName(curGroupId, modificationConfig.name),
                        id: curGroupId
                    });
                }));
            })
            .then(_.pluck('groupId'))
            .then(function (groupIds) {
                return _.map(groupIds, function (curGroupId) {
                    return { id: curGroupId };
                });
            });
    };

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
                .then(_.partial(_.applyMixin, DataCenterMetadata))
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
                return self.findByRef(dataCenter.getGroupId());
            })
        );
    }

    function loadGroupsById(criteria, rootGroups) {
        //TODO apply for composite criteria
        if (criteria.id) {
            return Promise.join(
                Promise.all(
                    _.map(_.asArray(criteria.id), function(groupId) {
                        return self.findByRef(groupId);
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
            .uniq(function(group) {return group.id;})
            .flatten()
            .value();
    }

    function filterGroups(criteria, groups) {

        if (!groups || groups.length === 0) {
            return [];
        }
        return _.filter(groups, new GroupCriteria(criteria).predicate().fn);
    }

    init();
}

function DataCenterMetadata() {
    var self = this;

    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}