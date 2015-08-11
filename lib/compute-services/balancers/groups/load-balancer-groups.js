var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var SharedLoadBalancerCriteria = require('./domain/balancer-criteria');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SharedLoadBalancers;

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

    /**
     * Method allow to create shared load balancer
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - search criteria that specify one single target data center
     * @param {string} command.name - target balancer name
     * @param {string} command.description - target balancer description
     *
     * @instance
     * @function create
     * @memberof SharedLoadBalancers
     */
    self.create = function(command) {
        var result = dataCenterService.findSingle(command.dataCenter)
            .then(function(dataCenter) {
                command = setBalancerStatus(command);
                return loadBalancerClient.createLoadBalancer(dataCenter.id, _.omit(command, "dataCenter"));
            });

        return new NoWaitOperationPromise(queueClient, processedBalancerRef, "Create Shared Load Balancer")
            .from(result);
    };

    function processedBalancerRef(response) {
        return { id: response.id };
    }

    function deleteBalancer(metadata) {
        return loadBalancerClient
            .deleteLoadBalancer(metadata.id, metadata.dataCenter.id)
            .then(function () {
                return {id: metadata.id};
            });
    }

    function processedBalancerRefs(balancers) {
        return _.map(balancers, processedBalancerRef);
    }

    /**
     * Method allow to delete shared load balancers
     * @param {SharedLoadBalancerCriteria} args - criteria that specify set of balancers that will be removed
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

        return loadBalancerClient.modifyLoadBalancer(balancer.id, balancer.dataCenter.id, modificationConfig)
            .then(function() {
                return balancer;
            });
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
     * @param {SharedLoadBalancerCriteria} args - criteria that specify set of balancers that will be searched
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