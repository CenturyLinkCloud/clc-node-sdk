
var _ = require('underscore');
var NetworkCriteria = require("./domain/network-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/search/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

module.exports = Networks;

/**
 * @typedef NetworkMetadata
 * @type {object}
 * @property {string} id - ID of the network being queried.
 * @property {string} name - Name of the network
 * @property {string} description - User-defined description of this network
 * @property {string} cidr - The network address, specified using CIDR notation
 * @property {string} gateway - Gateway IP address of the network
 * @property {string} netmask - A screen of numbers used for routing traffic within a subnet
 * @property {string} type - Network type, usually private for networks created by the user
 * @property {int} vlan - Unique number assigned to the VLAN
 * @property {Array} ipAddresses - IP addresses details
 * @property {Array} links - Collection of entity links that point to resources related to this network
 *
 * @example
 * {
 *  "id": "5f75bcd83292477089ad47ab90f135f3",
 *  "name": "vlan_309_10.110.109",
 *  "description": "vlan_309_10.110.109",
 *  "cidr": "10.110.109.0/24",
 *  "gateway": "10.110.109.1",
 *  "netmask": "255.255.255.0",
 *  "type": "private",
 *  "vlan": 309,
 *  "ipAddresses": [
 *    {
 *      "address": "10.110.109.12",
 *      "claimed": true,
 *      "primary": false,
 *      "server": "DE1ALTDCLN04",
 *      "type": "private"
 *    },
 *    {
 *      "address": "10.110.109.13",
 *      "claimed": true,
 *      "primary": false,
 *      "server": "DE1ALTDCLN05",
 *      "type": "private"
 *    }
 *  ],
 *  "links": []
 * }
 */

/**
 * Service that allow to manage networks in CenturyLink Cloud
 *
 * @param {DataCenters} dataCenterService
 * @param {NetworkClient} networkClient
 * @constructor
 */
function Networks(dataCenterService, networkClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    function initCriteria() {
        return new NetworkCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    /**
     * Method allows to search networks.
     *
     * @param {NetworkCriteria} networkSearchCriteria - criteria that specify set of networks that will be searched
     * @param {string} ipAddressesDetails Optional component of the query to request details
     * of IP Addresses in a certain state. Should be one of the following:
     * "none" (returns details of the network only),
     * "claimed" (returns details of the network as well as information about claimed IP addresses),
     * "free" (returns details of the network as well as information about free IP addresses) or
     * "all" (returns details of the network as well as information about all IP addresses).
     *
     *
     * @return {Promise<Array<NetworkMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Networks
     */
    self.find = function(networkSearchCriteria, ipAddressesDetails) {
        var criteria = initCriteria(networkSearchCriteria);

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadNetworks)
            .then(enhanceNetworks)
            .then(_.flatten)
            .then(_.partial(filterNetworks, criteria))
            .then(_.partial(loadIpAddressesDetails, ipAddressesDetails));
    };

    function loadNetworks(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return Promise.props(
                    {
                        networks: networkClient.findNetworks(dataCenter.id),
                        dataCenter: dataCenter
                    }
                );
            })
        );
    }

    function enhanceNetworks(props) {
        return Promise.all(
            _.map(props, function(prop) {
                return _.map(prop.networks, function(network) {
                    network.dataCenter = prop.dataCenter;

                    return network;
                });
            })
        );
    }

    function filterNetworks(criteria, networks) {

        if (!networks || networks.length === 0) {
            return [];
        }
        return _.filter(networks, new NetworkCriteria(criteria).predicate().fn);
    }

    function loadIpAddressesDetails(ipAddressesDetails, networks) {
        if (!ipAddressesDetails) {
            return Promise.resolve(networks);
        }

        return Promise.all(
            _.map(networks, function(network) {
                return networkClient.findNetwork(network.id, network.dataCenter.id, ipAddressesDetails);
            })
        );
    }

    init();
}