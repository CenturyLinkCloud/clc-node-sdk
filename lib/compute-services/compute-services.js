
var ServerService = require('./servers/server-service.js');
var TemplateService = require('./templates/template-service.js');
var _ = require('underscore');


module.exports = ComputeServices;

function ComputeServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    self.servers = _.memoize(function () {
        return new ServerService(getRestClientFn());
    });

    self.templates = _.memoize(function () {
        return new TemplateService(getRestClientFn());
    });

    init ();
}