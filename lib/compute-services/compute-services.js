
var Servers = require('./servers/servers.js');
var Templates = require('./templates/templates.js');
var Groups = require('./groups/groups.js');
var _ = require('underscore');
var DataCenter = require('./domain/datacenter.js');
var Os = require('./domain/os-type.js');
var Architecture = require('./domain/architecture.js');

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

    self.DataCenter = new DataCenter();
    self.Os = new Os();
    self.Machine = {
        Architecture: new Architecture()
    };

    init ();
}
