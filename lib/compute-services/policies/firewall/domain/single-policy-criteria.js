
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');
var Port = require('./port');
var toCidr = require('./ip-converter');
var _ = require('underscore');

module.exports = SingleFirewallPolicyCriteria;


/**
 * The type of {@link FirewallPolicyCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleFirewallPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - a firewall policy id restriction.
 * @property {String | Array<String>} status - a firewall policy status restriction.
 * @property {boolean} enabled - restriction that pass only enabled policy.
 * @property {String | Array<String>} source - a firewall policy source restriction.
 * @property {String | Array<String>} destination - a firewall policy destination restriction.
 * @property {String | Array<String>} destinationAccount - a firewall policy destination account restriction.
 * @property {String | Array<String> | Port} ports - a firewall policy ports restriction.
 *
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {String | Array<String>} dataCenterId - a data center id restriction.
 * @property {String | Array<String>} dataCenterName - a data center name restriction.
 * @property {String | Array<String>} dataCenterNameContains - restriction that pass only group which data center name
 * contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example policy criteria
 * {
 *     status: ["active"],
 *     enabled: true,
 *     source: ["10.100.8.1/28", {ip: '10.15.8.1', mask: '255.255.255.0'}],
 *     destination: ["10.100.8.1/28"],
 *     destinationAccount: ["ACCT"],
 *     ports: [Port.PING, Port.TCP(8081, 8085)],
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(policy) {
 *          return policy.source.length === 2;
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleFirewallPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('status'))
            .and(filterEnabled())
            .and(filterByIp('source'))
            .and(filterByIp('destination'))
            .and(filters.byParamAnyOf('destinationAccount', true))
            .and(filterByPort())
            .and(filters.byCustomPredicate()),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    function filterEnabled() {
        if (criteria.enabled === undefined) {
            return Predicate.alwaysTrue();
        }

        return Predicate.equalTo(criteria.enabled, 'enabled');
    }

    function filterByIp(property) {
        if (!criteria[property]) {
            return Predicate.alwaysTrue();
        }

        var ipCriteria = convertToCidr(criteria[property]);

        return new Predicate(function(data) {
            var ips = _.asArray(data[property]);

            return _.intersection(ipCriteria, ips).length !== 0;
        });

    }

    function convertToCidr(values) {
        return _.map(_.asArray(values), function(ipConfig) {
            if (ipConfig instanceof Object) {
                return toCidr(ipConfig.ip, ipConfig.mask);
            }

            return ipConfig;
        });
    }

    function filterByPort() {
        if (!criteria.ports) {
            return Predicate.alwaysTrue();
        }

        var portCriteria = _.asArray(criteria.ports);
        if (portCriteria.indexOf(Port.ANY) > -1) {
            return Predicate.alwaysTrue();
        }

        return new Predicate(function(data) {
            var ports = _.asArray(data.ports);

            return _.intersection(portCriteria, ports).length !== 0;
        });
    }

    init();
}