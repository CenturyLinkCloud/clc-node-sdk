
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
        return dataCenterService.findSingle(criteria.datacenter)
            .then(function(dataCenter) {
                return applyMixin(DataCenter, dataCenter).getGroupId();
            })
            .then(function(groupId) {
                return groupClient.get(groupId);
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
        return groupClient.get(groupRef.id ? groupRef.id : groupRef);
    }

    self.find = function(criteria) {
        if (!(criteria instanceof Object)) {
            throw new Error("criteria must be a Object");
        }

        if (Criteria.isConditionalCriteria(criteria)) {
            _.each(_.keys(criteria), function(key) {
                criteria[key] = _.map(criteria[key], function(subcriteria) {
                    return GroupCriteria.processDataCenterCriteria(subcriteria);
                });
            });
        } else {
            criteria = GroupCriteria.processDataCenterCriteria(criteria);
        }

        var dataCenterCriteria = DataCenterCriteria.extractCriteria(criteria, function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            //filter by data center
            .then(function(dataCenters) {
                return Promise.all(
                    _.map(dataCenters, function(dataCenter) {
                        return Promise.props({
                            group: groupClient.get(applyMixin(DataCenter, dataCenter).getGroupId()),
                            dataCenter: dataCenter
                        });
                    })
                );
            })
            .then(function(props) {
                //TODO apply for composite criteria
                if (criteria.id) {
                    return Promise.join(
                        Promise.all(
                            _.map(criteria.id, function(groupId) {
                                return Promise.props({group: findById(groupId)});
                            })),
                            props
                    );
                } else {
                    return props;
                }
            })
            .then(_.flatten)
            .then(function(props) {
                return Promise.all(_.map(props, function(prop) {
                    if (!prop.dataCenter) {
                        return Promise.props({
                            group: prop.group,
                            dataCenter: dataCenterService.findSingle({id: prop.group.locationId.toLowerCase()})
                        });
                    }
                    return prop;
                }));
            })
            .then(function(props) {
                return _.map(props, function(prop) {
                    prop.group.dataCenter = prop.dataCenter;
                    return prop.group;
                });
            })
            .then(function(groups) {
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
            })
            .then(function(groups) {
                if (!groups || groups.length === 0) {
                    return [];
                }
                return _.filter(groups, new GroupCriteria(criteria).predicate().fn);
            });
    };

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