
var rest = require('restling');
var _ = require('underscore');
var SdkClient = require('./sdk-client.js');
var loginClient = require('./../auth/login-client.js');
var Config = require('./../../config.js');

module.exports = AuthenticatedClient;

function AuthenticatedClient (username, password, options) {
    var self = this;
    var sdkClient = new SdkClient(options);
    var accountPromise;
    var userAgent = new Config().fetchUserAgent();

    function authHeader (account) {
        return { accessToken: account.bearerToken };
    }

    function resolveAliasTemplate(url, account) {
        return url.replace('{ACCOUNT}', account.accountAlias);
    }

    function makeOptions(options, account) {
        return _.extend({headers: {'User-Agent': userAgent}}, authHeader(account), options);
    }

    function whenAccountResolved(callback) {
        var promise = accountPromise || (accountPromise = login(username, password));
        return promise.then(callback);
    }

    function login(username, password) {
        var args = {};

        process.argv.forEach(function (item) {
            args[item.split('=')[0]] = item.split('=')[1];
        });

        return loginClient
            .login(
                username || args['--clc.username'] || process.env.CLC_USERNAME,
                password || args['--clc.password'] || process.env.CLC_PASSWORD
            );
    }

    self.get = function (url, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.get(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.postJson = function (url, requestData, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.postJson(
                resolveAliasTemplate(url, account),
                requestData,
                makeOptions(options, account)
            );
        });
    };

    self.delete = function (url, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.delete(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.patch = function (url, options) {
        return whenAccountResolved(function (account) {

            return sdkClient.patch(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.patchJson = function (url, data, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.patchJson(
                resolveAliasTemplate(url, account),
                data,
                makeOptions(options, account)
            );
        });
    };

    self.putJson = function (url, data, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.putJson(
                resolveAliasTemplate(url, account),
                data,
                makeOptions(options, account)
            );
        });
    };

    self.mixinStatusSupport = sdkClient.mixinStatusSupport;

}