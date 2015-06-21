
var Servers = require('./servers/servers.js');
var Templates = require('./templates/templates.js');
var Groups = require('./groups/groups.js');
var _ = require('underscore');
var DataCenter = require('./../base-services/datacenters/domain/datacenter.js');
var Server = require('./servers/domain/server.js');
var Group = require('./groups/domain/group.js');
var Os = require('./templates/domain/os-family.js');
var Architecture = require('./servers/domain/architecture.js');


module.exports = ComputeServices;

function ComputeServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.servers = _.memoize(function () {
        return new Servers(getRestClientFn());
    });

    self.templates = _.memoize(function () {
        return new Templates(getRestClientFn());
    });

    self.groups = _.memoize(function () {
        return new Groups(getRestClientFn());
    });

    self.DataCenter = DataCenter;

    self.Os = Os;

    self.Machine = {
        Architecture: Architecture
    };

    self.Server = Server;

    self.Group = Group;

    init ();
}
