
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
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

    /**
     * Method allow to create group
     *
     * @param {object} command
     * @param {GroupCriteria} command.parentGroup
     * @param {string} command.name
     * @param {string} command.description
     *
     * @memberof Groups
     */
    self.create = function (command) {
        var result = Promise
            .resolve(command)
            .then(function (command) {
                if (command.parentGroup) {
                    return self
                        .findByNameAndDatacenter(command.parentGroup)
                        .then(function (data) {
                            return _.extend(command, {parentGroupId: data.id});
                        });
                } else {
                    return command;
                }
            })
            .then(function (command) {
                return groupClient.createGroup(command);
            });

        return new NoWaitOperationPromise(queueClient, getGroupCriteria).from(result);
    };

    /**
     * Method allow to delete group of servers
     * @param groupCriteria
     *
     * @returns {OperationPromise}
     */
    self.delete = function (groupCriteria) {
        var result = groupClient.deleteGroup(groupCriteria.id);

        return new OperationPromise(queueClient, _.constant({ id: groupCriteria.id })).from(result);
    };

    function getGroupCriteria(response) {
        return { id: response.id };
    }

    function findById(groupRef) {
        return groupClient.findGroupById(groupRef.id ? groupRef.id : groupRef);
    }

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        criteria = new GroupCriteria(criteria).processDataCenterCriteria();

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