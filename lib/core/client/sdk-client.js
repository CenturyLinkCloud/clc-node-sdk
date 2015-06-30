
var rest = require('restling');
var _ = require('underscore');
var PromiseRetry = require('./promise-retry.js');

module.exports = SdkClient;


function SdkClient (options) {
    var CLC_ENDPOINT_URL = 'https://api.ctl.io';
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
        throw new Error(JSON.stringify(e));
    }

    function makeUrl (url) {
        return CLC_ENDPOINT_URL + url;
    }

    self.mixinStatusSupport = function (data) {
        return _.extend(Object.create(new StatusResult()), data);
    };

    self.get = function (url, options) {
        return new PromiseRetry(rest.get, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.postJson = function (url, data, options) {
        return new PromiseRetry(rest.postJson, [makeUrl(url), data, makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.delete = function (url, options) {
        return new PromiseRetry(rest.del, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.patch = function (url, options) {
        return new PromiseRetry(rest.patch, [makeUrl(url), makeOptions(options)], retryOpts);
    };

    self.patchJson = function (url, data, options) {
        var patchOptions = _.extend(makeOptions(options), { data: data });
        return new PromiseRetry(rest.patch, [makeUrl(url), patchOptions], retryOpts);
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
