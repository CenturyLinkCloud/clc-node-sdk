var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('underscore');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');
var Criteria = require('./../../../core/search/criteria.js');
var CreatePolicyJob = require('./domain/create-policy-job');
var Port = require('./domain/port');
var ToCidr = require('./domain/ip-converter');

module.exports = Firewall;

/**
 * @typedef FirewallPolicyMetadata
 * @type {object}
 * @property {String} id - ID of the firewall policy.
 * @property {String} status - The state of the policy; either active (policy is available and working as expected),
 * error (policy creation did not complete as expected) or pending (the policy is in the process of being created).
 * @property {boolean} enabled - Indicates if the policy is enabled (true) or disabled (false).
 * @property {Array<String>} source - Source addresses for traffic on the originating firewall,
 * specified using CIDR notation.
 * @property {Array<String>} destination - Destination addresses for traffic on the terminating firewall,
 * specified using CIDR notation.
 * @property {String} destinationAccount - Short code for a particular account.
 * @property {int} ports - Type of ports associated with the policy. Supported ports include:
 * any, icmp, TCP and UDP with single ports (tcp/123, udp/123) and port ranges (tcp/123-456, udp/123-456).
 * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
 * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *    "id": "1ac853b00e1011e5b9390800200c9a6",
 *    "status": "active",
 *    "enabled": true,
 *    "source": [
 *        "123.45.678.1/32",
 *        "123.45.678.2/32",
 *        "123.45.678.3/32"
 *    ],
 *    "destination": [
 *        "245.21.223.1/32",
 *        "245.21.223.2/32"
 *    ],
 *    "destinationAccount": "DEST_ALIAS",
 *    "ports": [
 *        "any"
 *    ],
 *    "links": [
 *        {
 *            "rel": "self",
 *            "href": "https://api.ctl.io/v2-experimental/firewallPolicies/SRC_ALIAS/WA1/1ac853b00e1011e5b9390800200c9a6",
 *            "verbs": [
 *                "GET",
 *                "PUT",
 *                "DELETE"
 *            ]
 *        }
 *    ]
 * }
 */

/**
 * Service that allow to manage firewall policy in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @constructor
 */
function Firewall(dataCenterService, policyClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);

        self.Port = Port;
    }

    function createPolicy(command, dataCenter) {
        composeRequest(command);

        return policyClient.createFirewallPolicy(_.omit(command, 'dataCenter'), dataCenter.id);
    }

    function composeRequest(command) {
        convertPorts(command);
        convertIp(command, 'source');
        convertIp(command, 'destination');

        return command;
    }

    function convertPorts(command) {
        if (command.ports) {
            var ports = _.asArray(command.ports);

            command.ports = _.map(ports, function(portConfig) {
                if (portConfig instanceof Object) {
                    return Port.convert(portConfig.protocol, portConfig.port, portConfig.to);
                }
                return portConfig;
            });
        } else {
            command.ports = ['any'];
        }

        return command;
    }

    function convertIp(command, property) {
        if (command[property]) {
            command[property] = new ToCidr(command[property]);
        } else {
            command[property] = []
        }

        return command;
    }

    function waitUntilPolicyIsConstructed(status) {
        return new CreatePolicyJob(policyClient, extractPolicyInfo(status)).await(2000);
    }

    function extractPolicyInfo(status) {
        var link = _.findWhere(status.links, {rel: 'self'});
        var parts = link.href.split('/');

        return {
            id: parts.pop(),
            dataCenterId: parts.pop()
        };
    }

    /**
     * Method allow to create firewall policy
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - DataCenterCriteria that specify data center
     * @param {string} command.destinationAccount - target policy name
     * @param {Array<string>} command.source - Source addresses for traffic on the originating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} command.destination - Destination addresses for traffic on the terminating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} command.ports - Type of ports associated with the policy.
     * Supported ports include: any, icmp, TCP and UDP with single ports (tcp/123, udp/123)
     * and port ranges (tcp/123-456, udp/123-456).
     * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
     * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
     * May be specified as config object using {@link Port}.
     *
     * @returns {Promise<Array<Reference>>} the array of created policies references
     *
     * @instance
     * @function create
     * @memberof Firewall
     */
    self.create = function (command) {
        return dataCenterService.findSingle(command.dataCenter)
            .then(_.partial(createPolicy, command))
            .then(waitUntilPolicyIsConstructed)
            .then(processPolicyRef);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteFirewallPolicy(policyMetadata.id, policyMetadata.dataCenter.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete firewall policy
     * @param {FirewallPolicyCriteria} arguments - criteria that specify set of policies that will be deleted
     *
     * @returns {Promise<Array<Reference>>} the array of deleted policies references
     *
     * @instance
     * @function delete
     * @memberof Firewall
     */
    self.delete = function () {
        var result = self
            .find(arguments)
            .then(_.partial(_.map, _, deletePolicy))
            .then(Promise.all);

        return new NoWaitOperationPromise(null, "Delete Firewall Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
                return policyClient.modifyFirewallPolicy(policy.id, composeRequest(config), policy.dataCenter.id);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }


    /**
     * Method allow to modify policy
     *
     * @param {FirewallPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} config
     * @param {Array<string>} config.source - Source addresses for traffic on the originating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} config.destination - Destination addresses for traffic on the terminating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} config.ports - Type of ports associated with the policy.
     * Supported ports include: any, icmp, TCP and UDP with single ports (tcp/123, udp/123)
     * and port ranges (tcp/123-456, udp/123-456).
     * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
     * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
     * May be specified as config object using {@link Port}.
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Firewall
     */
    self.modify = function (policyCriteria, config) {
        return self.find(policyCriteria)
            .then(_.partial(modifyPolicies, _, config));
    };

    /**
     * Method allows to search firewall policies.
     *
     * @param {FirewallPolicyCriteria} arguments - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<FirewallPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Firewall
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadDataCenterToPolicies)
            .then(_.flatten)
            .then(_.partial(filterPolicies, criteria));
    };

    function loadDataCenterToPolicies(dataCenters) {
        return Promise.all(_.map(dataCenters, function(dataCenter) {
            return policyClient.findFirewallPolicies(dataCenter.id)
                .then(function(policies) {
                    _.each(policies, function(policy) {
                        policy.dataCenter = dataCenter;
                    });

                    return Promise.resolve(policies);
                });
        }));
    }

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}