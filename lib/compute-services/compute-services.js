
var ServerClient = require('./servers/server-client.js');
var GroupClient = require('./groups/group-client.js');
var PolicyClient = require('./policies/policy-client.js');
var SharedLoadBalancerClient = require('./balancers/load-balancer-client.js');
var CreateServerConverter = require('./servers/domain/create-server-converter.js');
var Servers = require('./servers/servers.js');
var Statistics = require('./statistics/statistics.js');
var Templates = require('./templates/templates.js');
var Groups = require('./groups/groups.js');
var Policies = require('./policies/policies.js');
var Balancers = require('./balancers/load-balancers.js');
var _ = require('underscore');
var DataCenter = require('./../base-services/datacenters/domain/datacenter.js');
var Server = require('./servers/domain/server.js');
var Group = require('./groups/domain/group.js');
var OsFamily = require('./templates/domain/os-family.js');
var Architecture = require('./servers/domain/architecture.js');
var Resource = require('./statistics/domain/resource.js');
var MonitoringStatsType = require('./statistics/domain/monitoring-stats-type.js');
var Policy = require('./policies/domain/policy.js');


module.exports = ComputeServices;

function ComputeServices (getRestClientFn, baseServicesFn) {
    var self = this;

    function init () {

    }

    var serverClient = _.memoize(function () {
        return new ServerClient(getRestClientFn());
    });

    var groupClient = _.memoize(function () {
        return new GroupClient(getRestClientFn());
    });

    var queueClient = _.memoize(function () {
        return baseServicesFn()._queueClient();
    });

    var policyClient = _.memoize(function () {
       return new PolicyClient(getRestClientFn());
    });

    self.policies = _.memoize(function () {
        return new Policies(baseServicesFn().dataCenters(), policyClient(), queueClient());
    });

    var balancerClient = _.memoize(function () {
        return new SharedLoadBalancerClient(getRestClientFn());
    });

    self.balancers = _.memoize(function () {
        return new Balancers(baseServicesFn().dataCenters(), balancerClient(), queueClient());
    });

    var serverConverter = _.memoize(function () {
        return new CreateServerConverter(
            self.groups(),
            self.templates(),
            baseServicesFn().accountClient(),
            self.policies()
        );
    });

    self.groups = _.memoize(function () {
        return new Groups(
            baseServicesFn().dataCenters(),
            groupClient(),
            queueClient(),
            baseServicesFn().accountClient()
        );
    });

    self.servers = _.memoize(function () {
        return new Servers(
            serverClient(),
            serverConverter(),
            queueClient(),
            self.groups(),
            baseServicesFn().dataCenters()
        );
    });

    self.groups()._serverService(self.servers);

    self.templates = _.memoize(function () {
        return new Templates(baseServicesFn().dataCenters());
    });

    self.statistics = _.memoize(function() {
        return new Statistics(
            self.servers(),
            self.groups(),
            baseServicesFn().dataCenters()
        );
    });

    self.DataCenter = DataCenter;

    self.OsFamily = OsFamily;

    self.Machine = {
        Architecture: Architecture
    };

    self.Server = Server;

    self.Group = Group;

    self.Resource = Resource;

    self.MonitoringStatsType = MonitoringStatsType;

    self.Policy = Policy;

    init ();
}
