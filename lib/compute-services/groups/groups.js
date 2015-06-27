
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var SearchSupport = require('./../../core/search/search-support.js');
var _ = require('./../../core/underscore.js');
var GroupCriteria = require("./domain/group-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/criteria/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');

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
                return applyMixin(DataCenter, dataCenter).getGroupId();
            })
            .then(function(groupId) {
                return groupClient.findGroupById(groupId);
            })
            .then(function(group) {
                return _.findWhere(group.groups, {name: criteria.name});
            });
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
                console.log(groups);
                return Promise.all(_.map(groups, deleteGroup));
            });

        return new OperationPromise(queueClient, result).from(result);
    };

    function processedGroupRef(response) {
        return { id: response.id };
    }

    function findById(groupRef) {
        return groupClient.findGroupById(groupRef.id ? groupRef.id : groupRef);
    }

    self.find = function() {
        var criteria = new GroupCriteria(self._searchCriteriaFrom(arguments)).processDataCenterCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadRootGroups)
            .then(function(rootGroups) {
                return loadGroupsById.call(criteria, rootGroups);
            })
            .then(_.flatten)
            .then(loadDataCenterToGroups)
            .then(addDataCenterToGroups)
            .then(collectAllGroups)
            .then(function(groups) {
                return filterGroups.call(criteria, groups);
            });
    };

    function loadRootGroups(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return findById(applyMixin(DataCenter, dataCenter).getGroupId());
            })
        );
    }

    function loadGroupsById(rootGroups) {
        var criteria = this;
        //TODO apply for composite criteria
        if (criteria.id) {
            return Promise.join(
                Promise.all(
                    _.map(criteria.id, function(groupId) {
                        return findById(groupId);
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
        return _.flatten(
            _.uniq(
                _.flatten(_.map(
                    groups,
                    function(group) {
                        return applyMixin(Group, group).getAllGroups();
                    })
                ),
                function(group) {return group.id;}
            )
        );
    }

    function filterGroups(groups) {
        var criteria = this;

        if (!groups || groups.length === 0) {
            return [];
        }
        return _.filter(groups, new GroupCriteria(criteria).predicate().fn);
    }

    function applyMixin(Class, data) {
        return _.extend(Object.create(new Class()), data);
    }

    init ();
}

function Group() {
    var self = this;

    self.getAllGroups = function() {
        var group = this;
        _.each(group.groups, function(subgroup) {
            subgroup.dataCenter = group.dataCenter;
        });

        return _.filter(_.union(group.groups, _.map(group.groups, group.getAllGroups)), function(group) {
            return group.id;
        });
    };
}

function DataCenter() {
    var self = this;

    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}