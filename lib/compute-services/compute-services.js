
var ServerService = require('./servers/server-service.js');
var _ = require('underscore');


module.exports = ComputeServices;

function ComputeServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.servers = _.memoize(function () {
        return new ServerService(getRestClientFn());
    });

    init ();
}