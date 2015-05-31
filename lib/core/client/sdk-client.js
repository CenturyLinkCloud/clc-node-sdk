
var rest = require('restling');
var _ = require('underscore');

module.exports = SdkClient;


function SdkClient (options) {
    var self = this;

    function makeOptions(otherOptions) {
        return _.extend({}, options, otherOptions);
    }

    function extractData (response) {
        return response.data;
    }

    function logError(e) {
        console.log(arguments);
    }

    function makeUrl (url) {
        return 'https://api.ctl.io' + url;
    }

    self.get = function (url, options) {
        return rest.get(makeUrl(url), makeOptions(options)).then(extractData, logError);
    };

    self.postJson = function (url, data, options) {
        return rest.postJson(makeUrl(url), data, makeOptions(options)).then(extractData, logError);
    };
}
