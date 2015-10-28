var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var LoadBalancerNodeCriteria = require('./domain/node-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SharedLoadBalancerNodes;
/**
 * @typedef SharedLoadBalancerNodeMetadata
 * @type {object}
 * @property {String} status - Status of the node: enabled, disabled or deleted.
 * @property {String} ipAddress - The internal (private) IP address of the node server
 * @property {int} privatePort - The internal (private) port of the node server
 *
 * @example
 * {
 *    "status" : "enabled",
 *    "ipAddress" : "10.11.12.13",
 *    "privatePort" : 80
 *  }
 */

/**
 * @typedef CreateNodeConfig
 * @type {object}
 *
 * @property {string} status - Status of the node: enabled, disabled or deleted.
 * @property {string} ipAddress - The internal (private) IP address of the node server
 * @property {number} privatePort - The internal (private) port of the node server.
 * Must be a value between 1 and 65535.
 */

/**
 * Service that allow to manage load balancer nodes in CenturyLink Cloud
 *
 * @param loadBalancerPools
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancerNodes(loadBalancerPools, loadBalancerClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    function loadAllNodesWithPool(pool) {
        return Promise.props({
            pool: Promise.resolve(pool),
            nodes: loadBalancerClient.findLoadBalancerNodes(pool.id, pool.balancer.id, pool.balancer.dataCenter.id)
                .then(function(nodes) {
                    _.each(nodes, function(node) {
                        node.pool = pool;
                    });

                    return nodes;
                })
        });
    }

    /**
     * Method allow to create load balancer nodes
     *
     * @param {object} command
     * @param {LoadBalancerPoolCriteria} command.pool - the search criteria
     * that specifies one single target load balancer pool
     * @param {Array<CreateNodeConfig>} command.nodes - the list with nodes config
     *
     * @returns {Promise<Array<SharedLoadBalancerNodeMetadata>>} the array of created nodes
     *
     * @instance
     * @function create
     * @memberof SharedLoadBalancerNodes
     */
    self.create = function(command) {
        var result = loadBalancerPools.findSingle(command.pool)
            .then(loadAllNodesWithPool)
            .then(function(enhancedPool) {
                return modifyNodesForPool(
                    enhancedPool.pool,
                    _.asArray(enhancedPool.nodes, command.nodes),
                    command.nodes
                );
            });

        return new NoWaitOperationPromise(queueClient, "Create Load Balancer Node").from(result);
    };

    function findPools(criteria) {
         var poolCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.pool;
        });

        return loadBalancerPools.find(poolCriteria)
            .then(function(pools) {
                return Promise.all(_.map(pools, loadAllNodesWithPool));
            });
    }

    function deletePools(criteria, enhancedPool) {
        var pool = enhancedPool.pool;
        var nodes = enhancedPool.nodes;

        var nodesToDelete = filterNodes(nodes, criteria);

        if (nodesToDelete.length === 0) {
            return Promise.resolve(nodes);
        }

        var nodesLeft = _.filter(nodes, function(node) {
            return nodesToDelete.indexOf(node) === -1;
        });

        return modifyNodesForPool(pool, _.asArray(nodesLeft), nodesToDelete);
    }

    /**
    * Method allow to delete load balancer nodes
    * @param {LoadBalancerNodeCriteria} arguments - criteria that specify set of pool nodes that will be removed
    *
    * @returns {Promise<Array<SharedLoadBalancerNodeMetadata>>} the array of deleted nodes
    *
    * @instance
    * @function delete
    * @memberof SharedLoadBalancerNodes
    */
    self.delete = function () {
        var criteria = initCriteria(arguments);

        var result = findPools(criteria)
            .then(function(enhancedPools) {
                return Promise.settle(_.map(enhancedPools, _.partial(deletePools, criteria)));
            });

        return new NoWaitOperationPromise(queueClient, _.flatten, "Delete Load Balancer Node").fromInspections(result);
    };

    function modifyNodesForPool(pool, nodesToProcess, nodesToReturn) {
        nodesToProcess = _.map(nodesToProcess, function(node) {
            return _.omit(node, 'pool');
        });

        return loadBalancerClient
            .modifyLoadBalancerNodes(pool.id, pool.balancer.id, pool.balancer.dataCenter.id, nodesToProcess)
            .then(function() {
                _.each(nodesToReturn, function(node) {
                    node.pool = pool;
                });
                return nodesToReturn;
            });
    }

    function modifyNodes(enhancedPool, criteria, modificationConfig) {
        var pool = enhancedPool.pool;
        var nodes = enhancedPool.nodes;

        var nodesToUpdate = filterNodes(nodes, criteria);

        if (nodesToUpdate.length === 0) {
            return Promise.resolve(nodes);
        }

        var nodesWithoutUpdate = _.filter(nodes, function(node) {
            return nodesToUpdate.indexOf(node) === -1;
        });

        _.each(nodesToUpdate, function(node) {
            if (modificationConfig.ipAddress) {
                node.ipAddress = modificationConfig.ipAddress;
            }
            if (modificationConfig.privatePort) {
                node.privatePort = modificationConfig.privatePort;
            }
            if (modificationConfig.status) {
                node.status = modificationConfig.status;
            }
        });

        return modifyNodesForPool(pool, _.asArray(nodesWithoutUpdate, nodesToUpdate), nodesToUpdate);
    }

    /**
     * Method allow to modify load balancer nodes
     *
     * @param {LoadBalancerNodeCriteria} nodeCriteria - criteria that specify set of nodes that will be modified
     *
     * @param {CreateNodeConfig} modificationConfig - update config
     *
     * @return {Promise<Array<SharedLoadBalancerNodeMetadata>>} - promise that resolved by list of nodes.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancerNodes
     */
    self.modify = function (nodeCriteria, modificationConfig) {
        var criteria = initCriteria(nodeCriteria);

        var result = findPools(criteria)
            .then(function(enhancedPools) {
                return Promise.settle(
                    _.map(enhancedPools, _.partial(modifyNodes, _, criteria, modificationConfig))
                );
            });

        return new NoWaitOperationPromise(queueClient, "Update Load Balancer Node").fromInspections(result);
    };

    /**
     * Method allows to search load balancer nodes.
     *
     * @param {LoadBalancerNodeCriteria} arguments - criteria that specify set of balancer pools that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerNodeMetadata>>} - promise that resolved by list of nodes.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancerNodes
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        return findPools(criteria)
            .then(_.partial(_.pluck, _, 'nodes'))
            .then(_.flatten)
            .then(_.partial(filterNodes, _, criteria));
    };

    function filterNodes(nodes, criteria) {
        if (!nodes || nodes.length === 0) {
            return [];
        }
        return _.filter(nodes, new LoadBalancerNodeCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new LoadBalancerNodeCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}