
var Servers = require('./servers/servers.js');
var Templates = require('./templates/templates.js');
var _ = require('underscore');


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

    init ();
}
