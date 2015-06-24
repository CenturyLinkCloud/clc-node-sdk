
var ServerClient = require('./servers/server-client.js');
var GroupClient = require('./groups/group-client.js');
var CreateServerConverter = require('./servers/domain/create-server-converter.js');
var Servers = require('./servers/servers.js');
var Templates = require('./templates/templates.js');
var Groups = require('./groups/groups.js');
var _ = require('underscore');
var DataCenter = require('./../base-services/datacenters/domain/datacenter.js');
var Server = require('./servers/domain/server.js');
var Group = require('./groups/domain/group.js');
var OsFamily = require('./templates/domain/os-family.js');
var Architecture = require('./servers/domain/architecture.js');


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

    var serverConverter = _.memoize(function () {
        return new CreateServerConverter(self.groups(), self.templates());
    });

    var queueClient = _.memoize(function () {
        return baseServicesFn()._queueClient();
    });

    self.servers = _.memoize(function () {
        return new Servers(
            serverClient(),
            serverConverter(),
            queueClient()
        );
    });

    self.templates = _.memoize(function () {
        return new Templates(baseServicesFn().dataCenters());
    });

    self.groups = _.memoize(function () {
        return new Groups(
            serverClient(),
            baseServicesFn().dataCenters(),
            groupClient(),
            queueClient()
        );
    });

    self.DataCenter = DataCenter;

    self.OsFamily = OsFamily;

    self.Machine = {
        Architecture: Architecture
    };

    self.Server = Server;

    self.Group = Group;

    init ();
}
