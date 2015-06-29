
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var _ = require('./../../core/underscore.js');
var GroupCriteria = require("./domain/group-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/criteria/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');

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

    self.findByNameAndDatacenter = function(criteria) {
        return dataCenterService.findSingle(criteria.dataCenter)
            .then(function(dataCenter) {
                return _.applyMixin(DataCenterMetadata, dataCenter).getGroupId();
            })
            .then(function(groupId) {
                return self.findByRef(groupId);
            })
            .then(function(group) {
                return _.findWhere(group.groups, {name: criteria.name});
            })
            .then(_.partial(_.applyMixin, GroupMetadata));
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

    self.findByRef = function (groupRef, includeServerDetails) {
        return groupClient
            .findGroupById(groupRef.id ? groupRef.id : groupRef, includeServerDetails)
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        criteria = new GroupCriteria(criteria).processDataCenterCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(_.partial(_.applyMixin, DataCenterMetadata))
            .then(loadRootGroups)
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
                    _.map(criteria.id, function(groupId) {
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
}

function DataCenterMetadata() {
    var self = this;

    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}