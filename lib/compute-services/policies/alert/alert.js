var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('./../../../core/underscore.js');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');


module.exports = Alert;

/**
 * Service that allow to manage alert policies in CenturyLink Cloud
 *
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function Alert(policyClient, queueClient) {
    var self = this;

    var delay = 500;
    var maxThreshold = 95;
    var minThreshold = 5;

    function init () {
        SearchSupport.call(self);
    }

    function composePolicyConfig(command) {
        composeActions(command);
        _.each(command.triggers, composeTrigger);

        return command;
    }

    function composeActions(command) {

        if (command.actions && _.every(command.actions, _.isString)) {
            command.actions = [{
                action: "email",
                settings: {
                    recipients: command.actions
                }
            }];
        }

        _.each(command.actions, function(action) {
            if (action === undefined || action.action === undefined) {
                throw new Error("Please specify alert policy action");
            }
        });

        return command;
    }

    function composeTrigger(trigger) {
        trigger.duration = convertDuration(trigger.duration);
        trigger.threshold = convertThreshold(trigger.threshold);
    }

    function convertDuration(duration) {
        return "00:" + (duration > 9 ? duration : "0" + duration) + ":00";
    }

    function convertThreshold(threshold) {
        var rounded5 = Math.ceil(threshold/5)*5;

        if (rounded5 < minThreshold) {
            rounded5 = minThreshold;
        } else if (rounded5 > maxThreshold) {
            rounded5 = maxThreshold;
        }

        return rounded5;
    }

    /**
     * Method allow to create alert policy
     *
     * @param {object} command
     * @param {string} command.name - target policy name
     * @param {Array} command.actions - The actions to perform when the alert is triggered.
     * @param {Array} command.triggers - The definition of the triggers that fire the alert.
     *
     * @instance
     * @function create
     * @memberof Alert
     */
    self.create = function (command) {
        var result = Promise.resolve(composePolicyConfig(command))
            .then(policyClient.createAlertPolicy)
            .delay(delay);

        return new NoWaitOperationPromise(queueClient, processPolicyRef, "Create Alert Policy").from(result);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteAlertPolicy(policyMetadata.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete alert policy
     * @param {AlertPolicyCriteria} args - criteria that specify set of policies that will be removed
     *
     * @returns {OperationPromise}
     *
     * @instance
     * @function delete
     * @memberof Alert
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(_.partial(_.map, _, deletePolicy));

        return new NoWaitOperationPromise(queueClient, "Delete Alert Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
            var modifyConfig = _.chain(policy)
                .extend(config)
                .omit("links")
                .value();
                return policyClient.modifyAlertPolicy(policy.id, modifyConfig)
                    .delay(delay);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }

    /**
     * Method allow to modify alert policy
     *
     * @param {AlertPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new policy name
     * @return {Promise<AlertPolicyCriteria[]>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Policies
     */
    self.modify = function (policyCriteria, modificationConfig) {
        return self.find(self._searchCriteriaFrom(policyCriteria))
            .then(_.partial(modifyPolicies, _, composePolicyConfig(modificationConfig)));
    };

    /**
     * Method allows to search alert policies.
     *
     * @param {AlertPolicyCriteria} args - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AlertPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Alert
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findAlertPolicies()
            .then(_.property('items'))
            .then(_.partial(filterPolicies, criteria));
    };

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}