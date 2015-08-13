var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('./../../../core/underscore.js');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');


module.exports = AntiAffinity;

/**
 * @typedef AntiAffinityPolicyMetadata
 * @type {object}
 * @property {String} id - ID of the anti-affinity policy.
 * @property {String} name - Name of the anti-affinity policy.
 * @property {int} location - Data center location of the anti-affinity policy.
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *  "id":"80a7bf90b199454b859399bff54f4173",
 *  "name":"My Anti-Affinity Policy",
 *  "location":"VA1",
 *  "links":[
 *    {
 *      "rel":"self",
 *      "href":"/v2/antiAffinityPolicies/alias/80a7bf90b199454b859399bff54f4173",
 *      "verbs":[
 *        "GET",
 *        "DELETE",
 *        "PUT"
 *      ]
 *    },
 *    {
 *      "rel":"server",
 *      "href":"/v2/servers/alias/va1aliashypsc01",
 *      "id":"va1aliashypsc01",
 *      "name":"VA1ALIASHYPSC01"
 *    }
 *  ]
 * }
 */

/**
 * Service that allow to manage anti-affinity policy in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function AntiAffinity(dataCenterService, policyClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    function composeCreatePolicyPromise(command) {
        return dataCenterService.find(command.dataCenter)
            .then(_.partial(loadDataCenters, command))
            .then(Promise.all);
    }

    function loadDataCenters(command, dataCenters) {
        return _.map(dataCenters, function(dataCenter) {
            return composeCreatePolicyRequest(dataCenter, command);
        });
    }

    function composeCreatePolicyRequest(dataCenter, command) {
        return {
            name: command.name,
            location: dataCenter.id
        };
    }

    /**
     * Method allow to create anti-affinity policy
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - DataCenterCriteria that specify data centers
     * @param {string} command.name - target policy name
     *
     * @returns {Promise<Array<Reference>>} the array of created policies references
     *
     * @instance
     * @function create
     * @memberof AntiAffinity
     */
    self.create = function (command) {
        var result = composeCreatePolicyPromise(command)
            .then(_.partial(_.map, _, policyClient.createAntiAffinityPolicy))
            .then(Promise.all);

        return new NoWaitOperationPromise(queueClient, processPolicyRefs, "Create Anti-Affinity Policy").from(result);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteAntiAffinityPolicy(policyMetadata.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete anti-affinity policy
     * @param {AntiAffinityPolicyCriteria} args - criteria that specify set of policies that will be deleted
     *
     * @returns {Promise<Array<Reference>>} the array of deleted policies references
     *
     * @instance
     * @function delete
     * @memberof AntiAffinity
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (policies) {
                return Promise.all(_.map(policies, deletePolicy));
            });

        return new NoWaitOperationPromise(queueClient, "Delete Anti-Affinity Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
                return policyClient.modifyAntiAffinityPolicy(policy.id, config);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }

    /**
     * Method allow to modify policy
     *
     * @param {AntiAffinityPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new policy name
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof AntiAffinity
     */
    self.modify = function (policyCriteria, modificationConfig) {
        var criteria = self._searchCriteriaFrom(policyCriteria);

        return self.find(criteria)
            .then(_.partial(modifyPolicies, _, modificationConfig));
    };

    /**
     * Method allows to search anti-affinity policies.
     *
     * @param {AntiAffinityPolicyCriteria} args - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AntiAffinityPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof AntiAffinity
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findAntiAffinityPolicies()
            .then(_.property('items'))
            .then(loadDataCenterToPolicies)
            .then(addDataCenterToPolicies)
            .then(_.partial(filterPolicies, criteria));
    };

    function loadDataCenterToPolicies(policies) {
        return Promise.all(_.map(policies, function(policy) {
            return Promise.props({
                policy: policy,
                dataCenter: dataCenterService.findSingle({id: policy.location.toLowerCase()})
            });
        }));
    }

    function addDataCenterToPolicies(enhancedPolicies) {
        return _.map(enhancedPolicies, function(prop) {
            prop.policy.dataCenter = prop.dataCenter;
            return prop.policy;
        });
    }

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}