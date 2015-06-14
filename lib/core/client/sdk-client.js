
var rest = require('restling');
var _ = require('underscore');
var RetryPromise = require('./retry-promise.js');

module.exports = SdkClient;


function SdkClient (options) {
    var self = this;

    var retryOpts = options ?
        {max: options.maxRetries, retryInterval: options.retryInterval} : null;

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

    self.mixinStatusSupport = function (data) {
        return _.extend(Object.create(new StatusResult()), data);
    };

    self.get = function (url, options) {
        return RetryPromise(rest.get, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.postJson = function (url, data, options) {
        return RetryPromise(rest.postJson, [makeUrl(url), data, makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.delete = function (url, options) {
        return RetryPromise(rest.del, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };
}

function StatusResult () {

    this.findStatusId = function () {
        return _.findWhere(this.links, {rel: "status"}).id;
    };

    this.findSelfId = function () {
        return _.findWhere(this.links, {rel: "self"}).id;
    };

}
