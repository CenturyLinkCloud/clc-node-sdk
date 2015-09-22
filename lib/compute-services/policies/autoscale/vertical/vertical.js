var _ = require('underscore');
var PolicyCriteria = require("./domain/policy-criteria.js");
var SearchSupport = require('./../../../../core/search/search-support.js');


module.exports = Vertical;

/**
 * @typedef AutoScaleRange
 * @type {object}
 * @property {int} min - Minimum number of CPU
 * @property {int} max - Maximum number of CPU
 */

/**
 * @typedef ScaleDownWindow
 * @type {object}
 * @property {String} start - Start time of window in UTC
 * @property {String} end - End time of window in UTC
 */

/**
 * @typedef AutoScalePolicyMetadata
 * @type {object}
 * @property {String} id - ID of the anti-affinity policy.
 * @property {String} name - Name of the anti-affinity policy.
 * @property {String} resourceType - The resource type to autoscale; only cpu is supported at this time.
 * @property {int} thresholdPeriodMinutes - Duration the resource must be at min/max in order to autoscale
 * (5, 10, 15, or 30 minutes).
 * @property {int} scaleUpIncrement - Number of CPU to increase on a scale up event (1, 2, or 4).
 * @property {AutoScaleRange} range - The range defining the minimum and maximum number of CPU to allow (between 1-16).
 * @property {int} scaleUpThreshold - Will scale up when resource it at this setting for at least the threshold period
 * (between 1-100).
 * @property {int} scaleDownThreshold - Will scale down when resource it at this setting for at least the threshold period
 * (between 1-100).
 * @property {ScaleDownWindow} scaleDownWindow - A server reboot is required for all resource scale downs; this is
 * the scale down window during which the resource will be set to the policy's minimum value.
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *   "id": "3b6f26003c224596bc7e748a0adc97d5",
 *   "name": "Production Database Scale Policy",
 *   "resourceType": "cpu",
 *   "thresholdPeriodMinutes": 5,
 *   "scaleUpIncrement": 1,
 *   "range": {
 *     "max": 6,
 *     "min": 2
 *   },
 *   "scaleUpThreshold": 85,
 *   "scaleDownThreshold": 15,
 *   "scaleDownWindow": {
 *     "start": "02:00",
 *     "end": "04:00"
 *   },
 *   "links": [
 *     {
 *       "rel": "self",
 *       "href": "/v2/autoscalePolicies/ALIAS/3b6f26003c224596bc7e748a0adc97d5"
 *     }
 *   ]
 * }
 */

/**
 * Service that allow to manage auto scale policy in CenturyLink Cloud
 *
 * @param policyClient
 * @constructor
 */
function Vertical(policyClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Method allows to search auto scale policies.
     *
     * @param {AntiAffinityPolicyCriteria} arguments - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AutoScalePolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Vertical
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findVerticalAutoscalePolicies()
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