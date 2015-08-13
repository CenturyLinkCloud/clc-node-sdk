var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var LoadBalancerPoolCriteria = require('./domain/pool-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SharedLoadBalancerPools;


/**
 * @typedef SharedLoadBalancerPoolMetadata
 * @type {object}
 * @property {String} id - ID of the load balancer pool
 * @property {int} port - Port configured on the public-facing side of the load balancer pool.
 * @property {String} method - The balancing method for this load balancer, either leastConnection or roundRobin.
 * @property {String} persistence - The persistence method for this load balancer, either standard or sticky.
 * @property {Array<SharedLoadBalancerNodeMetadata>} nodes - Collection of nodes configured behind this shared load balancer
 * @property {Array} links - Collection of entity links that point to resources related to this load balancer pool
 *
 * @example
 * {
 *   "id" : "2fa937bd20dd47c9b856376e9499c0c1",
 *   "port" : 80,
 *   "method" : "roundRobin",
 *   "persistence" : "standard",
 *   "nodes" : [
 *     {
 *       "status" : "enabled",
 *       "ipAddress" : "10.11.12.13",
 *       "privatePort" : 80,
 *       "name" : "10.11.12.13"
 *     },
 *     {
 *       "status" : "enabled",
 *       "ipAddress" : "10.11.12.14",
 *       "privatePort" : 80,
 *       "name" : "10.11.12.14"
 *     }
 *   ],
 *   "links" : [
 *     {
 *       "rel" : "self",
 *       "href" : "/v2/sharedLoadBalancers/ALIAS/WA1/ae3bbac5d9694c70ad7de062476ccb70/pools/2fa937bd20dd47c9b856376e9499c0c1",
 *       "verbs" : [
 *         "GET",
 *         "PUT",
 *         "DELETE"
 *       ]
    },
 *     {
 *       "rel" : "nodes",
 *       "href" : "/v2/sharedLoadBalancers/ALIAS/WA1/ae3bbac5d9694c70ad7de062476ccb70/pools/2fa937bd20dd47c9b856376e9499c0c1/nodes",
 *       "verbs" : [
 *         "GET",
 *         "PUT"
 *       ]
 *     }
 *   ]
 * }
 */
/**
 * Service that allow to manage load balancer pools in CenturyLink Cloud
 *
 * @param loadBalancerGroups
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancerPools(loadBalancerGroups, loadBalancerClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Method allow to create load balancer pool
     *
     * @param {object} command
     * @param {SharedLoadBalancerCriteria} command.balancer - the search criteria
     * that specify one single target shared load balancer
     * @param {number} command.port - Port to configure on the public-facing side of the load balancer pool.
     * Must be either 80 (HTTP) or 443 (HTTPS).
     * @param {string} command.method - The balancing method for this load balancer,
     * either leastConnection or roundRobin. Default is roundRobin.
     * @param {string} command.persistence - The persistence method for this load balancer, either standard or sticky.
     * Default is standard.
     *
     * @returns {Promise<Reference>} the array of created pool reference
     * @instance
     * @function create
     * @memberof SharedLoadBalancerPools
     */
    self.create = function(command) {
        var result = loadBalancerGroups.findSingle(command.balancer)
            .then(function(balancer) {
                return loadBalancerClient.createLoadBalancerPool(
                    balancer.dataCenter.id, balancer.id, _.omit(command, "balancer")
                );
            });

        return new NoWaitOperationPromise(queueClient, processedPoolRef, "Create Load Balancer Pool").from(result);
    };

    function processedPoolRef(response) {
        return { id: response.id };
    }

    function deletePool(metadata) {
        return loadBalancerClient
            .deleteLoadBalancerPool(metadata.id, metadata.balancer.dataCenter.id, metadata.balancer.id)
            .then(function () {
                return {id: metadata.id};
            });
    }

    function processedPoolRefs(balancers) {
        return _.map(balancers, processedPoolRef);
    }

    /**
     * Method allow to delete load balancer pools
     * @param {LoadBalancerPoolCriteria} args - criteria that specify set of balancer pools that will be removed
     *
     * @returns {Promise<Array<Reference>>} the array of deleted pools references
     *
     * @instance
     * @function delete
     * @memberof SharedLoadBalancerPools
     */
    self.delete = function () {

        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (balancers) {
                return Promise.settle(_.map(balancers, deletePool));
            });

        return new NoWaitOperationPromise(queueClient, processedPoolRefs, "Delete Balancer Pool").fromInspections(result);
    };

    function modifySingle(modificationConfig, pool) {
        return loadBalancerClient.modifyLoadBalancerPool(
            pool.id, pool.balancer.dataCenter.id, pool.balancer.id,  modificationConfig)
            .then(function() {
                return pool;
            });
    }

    /**
     * Method allow to modify load balancer pool resource settings
     *
     * @param {LoadBalancerPoolCriteria} poolCriteria - criteria that specify set of balancers that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.method - The balancing method for this load balancer,
     * either leastConnection or roundRobin. Default is roundRobin.
     * @param {string} modificationConfig.persistence - The persistence method for this load balancer,
     * either standard or sticky. Default is standard.
     *
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancerPools
     */
    self.modify = function (poolCriteria, modificationConfig) {
        var criteria = initCriteria(poolCriteria);

        var result = self.find(criteria)
            .then(function(balancers) {
                return Promise.settle(_.map(balancers, _.partial(modifySingle, modificationConfig)));
            });

        return new NoWaitOperationPromise(queueClient, processedPoolRefs, "Update Balancer Pool").fromInspections(result);
    };

    /**
     * Method allows to search load balancer pools.
     *
     * @param {LoadBalancerPoolCriteria} args - criteria that specify set of balancer pools that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerPoolMetadata>>} - promise that resolved by list of pools.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancerPools
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var balancerCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.balancer;
        });

        return loadBalancerGroups.find(balancerCriteria)
            .then(loadBalancerPools)
            .then(_.flatten)
            .then(_.partial(filterPools, _, criteria));
    };

    function loadBalancerPools(balancers) {
        return Promise.all(
            _.map(balancers, function(balancer) {
                return loadBalancerClient.findLoadBalancerPools(balancer.dataCenter.id, balancer.id)
                    .then(function(pools) {
                        _.each(pools, function(pool) {
                            pool.balancer = balancer;
                        });

                        return pools;
                    });
            })
        );
    }

    function filterPools(pools, criteria) {
        if (!pools || pools.length === 0) {
            return [];
        }
        return _.filter(pools, new LoadBalancerPoolCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new LoadBalancerPoolCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}