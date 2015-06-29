
var _ = require('underscore');
var assert = require('assert');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var ServerBuilder = require('./server-builder.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

describe('Find Server Credentials for Single Server [UNIT]', function () {
    var serverBuilder = new ServerBuilder(compute);
    var servers = compute.servers();

    vcr.it('Should return correct credentials of created server', function (done) {
        this.timeout(15 * 60 * 1000);

        serverBuilder
            .createCentOsVm({password: '1qa@WS3ed'})
            .then(servers.findCredentials)
            .then(_.property('password'))
            .then(_.partial(assert.equal, '1qa@WS3ed'))
            .then(serverBuilder.deleteServer(done));
    });

});