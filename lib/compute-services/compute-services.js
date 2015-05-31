
var ServerService = require('./servers/server-service.js');
var _ = require('underscore');


module.exports = ComputeService;

function ComputeService (getRestClientFn) {
    var self = this;
    var username;
    var password;

    function init () {

    }

    function clientOptions () {
        return { };
    }

    self.servers = _.memoize(function () {
        return new ServerService(getRestClientFn());
    });

    init ();
}