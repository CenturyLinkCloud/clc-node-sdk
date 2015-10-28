var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var SharedLoadBalancerCriteria = require('./domain/balancer-criteria');
var Criteria = require('./../../../core/search/criteria.js');
var CreateLoadBalancerJob = require('./../../../base-services/queue/domain/create-load-balancer-job');

module.exports = SharedLoadBalancers;

/**
 * @typedef SharedLoadBalancerGroupMetadata
 * @type {object}
 * @property {String} id - ID of the load balancer
 * @property {String} name - Friendly name of the load balancer
 * @property {String} description - Description for the load balancer
 * @property {String} ipAddress - The external (public) IP address of the load balancer
 * @property {String} status - Status of the load balancer: enabled, disabled or deleted
 * @property {Array<SharedLoadBalancerPoolMetadata>} pools - Collection of pools configured for this shared load balancer
 * @property {Array} links - Collection of entity links that point to resources related to this load balancer
 *
 * @example
 * {
 *   "id" : "ae3bbac5d9694c70ad7de062476ccb70",
 *   "name" : "My Load Balancer",
 *   "description" : "My Load Balancer",
 *   "ipAddress" : "12.34.56.78",
 *   "status" : "disabled",
 *   "pools" : [
 *     {
 *       "id" : "2fa937bd20dd47c9b856376e9499c0c1",
 *       "port" : 80,
 *       "method" : "roundRobin",
 *       "persistence" : "standard",
 *       "nodes" : [
 *         {
 *           "status" : "enabled",
 *           "ipAddress" : "10.11.12.13",
 *           "privatePort" : 80,
 *           "name" : "10.11.12.13"
 *         },
 *         {
 *           "status" : "enabled",
 *           "ipAddress" : "10.11.12.14",
 *           "privatePort" : 80,
 *           "name" : "10.11.12.14"
 *         }
 *       ],
 *       "links" : [...]
 *     }
 *   ],
 *   "links" : [...]
 * }
 */

/**
 * Service that allow to manage shared load balancers groups in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancers(dataCenterService, loadBalancerClient, queueClient) {
    var self = this;

    var Status = {
        ENABLED: "enabled",
        DISABLED: "disabled"
    };

    function init () {
        SearchSupport.call(self);
    }

    self._poolService = function(poolService) {
        self.pools = poolService;
    };

    /**
     * Method allow to create shared load balancer
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - search criteria that specify one single target data center
     * @param {string} command.name - target balancer name
     * @param {string} command.description - target balancer description
     * @param {CreatePoolConfig} command.pool - if specified, creates pools
     *
     * @instance
     * @function create
     * @memberof SharedLoadBalancers
     */
    self.create = function(command) {
        var result = dataCenterService.findSingle(command.dataCenter)
            .then(function(dataCenter) {
                command = setBalancerStatus(command);
                return loadBalancerClient.createLoadBalancer(dataCenter.id, _.omit(command, "dataCenter"))
                    .then(function(result) {
                        result.dataCenter = dataCenter;
                        return new CreateLoadBalancerJob(self, result).await();
                    });
            })
            .then(_.partial(addPools, command));

        return new NoWaitOperationPromise(queueClient, processedBalancerRef, "Create Shared Load Balancer")
            .from(result);
    };

    function addPools(command, balancer) {
        if (command.pool) {
            return Promise.all(_.map(_.asArray(command.pool), function(poolConfig) {
                poolConfig.balancer = processedBalancerRef(balancer);
                return self.pools().create(poolConfig);
            }))
            .then(_.partial(Promise.resolve, balancer));
        }

        return Promise.resolve(balancer);
    }

    function processedBalancerRef(response) {
        return { id: response.id };
    }

    function processedBalancerRefs(balancers) {
        return _.map(balancers, processedBalancerRef);
    }

    function deleteBalancer(metadata) {
        return loadBalancerClient
            .deleteLoadBalancer(metadata.id, metadata.dataCenter.id)
            .then(_.partial(processedBalancerRef, metadata));
    }

    /**
     * Method allow to delete shared load balancers
     * @param {SharedLoadBalancerCriteria} arguments - criteria that specify set of balancers that will be removed
     *
     * @returns {OperationPromise}
     *
     * @instance
     * @function delete
     * @memberof SharedLoadBalancers
     */
    self.delete = function () {

        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (balancers) {
                return Promise.settle(_.map(balancers, deleteBalancer));
            });

        return new NoWaitOperationPromise(queueClient, processedBalancerRefs, "Delete Shared Load Balancer")
            .fromInspections(result);
    };

    function modifySingle(modificationConfig, balancer) {
        if (modificationConfig.name === undefined) {
            modificationConfig.name = balancer.name;
        }

        if (modificationConfig.description === undefined) {
            modificationConfig.description = balancer.description;
        }

        return Promise.join(
            loadBalancerClient.modifyLoadBalancer(balancer.id, balancer.dataCenter.id, modificationConfig),
            modifyPools(modificationConfig),
            function() {
                return balancer;
            }
        );
    }

    function modifyPools(modificationConfig) {
        if (modificationConfig.pool) {
            return Promise.all(_.map(_.asArray(modificationConfig.pool), function(poolConfig) {
                if (poolConfig.id) {
                    return self._poolService().modify({id: poolConfig.id}, _.omit(poolConfig, 'id'));
                } else {
                    return self._poolService().find({balancer: _.omit(modificationConfig, 'pool')})
                        .then(function(pools) {
                            return _.findWhere(pools, {port: poolConfig.port});
                        })
                        .then(function(pool) {
                            if (pool) {
                                return self._poolService().modify({id: pool.id}, poolConfig);
                            } else {
                                return self.pools().create(poolConfig);
                            }
                        });
                }
            })
            );
        }
        return Promise.resolve();
    }

    function setBalancerStatus(config) {
        if (config.enabled === true) {
            config.status = Status.ENABLED;
        } else if (config.enabled === false) {
            config.status = Status.DISABLED;
        }

        return _.omit(config, "enabled");
    }

    /**
     * Method allow to modify shared load balancer resource settings
     *
     * @param {SharedLoadBalancerCriteria} balancerCriteria -
     * criteria that specify set of balancers that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new balancer name
     * @param {string} modificationConfig.description - new value of balancer description
     * @param {boolean} modificationConfig.enabled - the new status of balancer
     * @param {CreatePoolConfig} modificationConfig.pool - if specified, updates pools
     * @return {Promise<SharedLoadBalancerCriteria[]>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancers
     */
    self.modify = function (balancerCriteria, modificationConfig) {
        var criteria = initCriteria(balancerCriteria);

        modificationConfig = setBalancerStatus(modificationConfig);

        var result = self.find(criteria)
            .then(function(balancers) {
                return Promise.settle(_.map(balancers, _.partial(modifySingle, modificationConfig)));
            });

        return new NoWaitOperationPromise(queueClient, processedBalancerRefs, "Update Shared Load Balancer")
            .fromInspections(result);
    };

    /**
     * Method allows to search shared load balancers.
     *
     * @param {SharedLoadBalancerCriteria} arguments - criteria that specify set of balancers that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerCriteria>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancers
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadBalancersByDataCenter)
            .then(setDataCenterToBalancers)
            .then(_.partial(filterBalancers, _, criteria));
    };

    function loadBalancersByDataCenter(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return Promise.props(
                    {
                        dataCenter: dataCenter,
                        balancers: loadBalancerClient.findLoadBalancers(dataCenter.id)
                    }
                );
            })
        );
    }

    function setDataCenterToBalancers(props) {
        return _.chain(props)
            .map(function(prop) {
                _.each(prop.balancers, function(balancer) {
                    balancer.dataCenter = prop.dataCenter;
                });

                return prop.balancers;
            })
            .flatten()
            .value();
    }

    function filterBalancers(balancers, criteria) {
        if (!balancers || balancers.length === 0) {
            return [];
        }
        return _.filter(balancers, new SharedLoadBalancerCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new SharedLoadBalancerCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}