
var _ = require('underscore');
var assert = require('assert');
var vcr = require('nock-vcr-recorder-mocha');

var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var DataCenter = compute.DataCenter;
var Server = compute.Server;
var Group = compute.Group;

vcr.describe('Clone server operation [UNIT]', function () {

    var serverToBeClonedId = 'de1altdweb598';

    it('Should clone created server', function (done) {
        this.timeout(10000);

        compute.servers()
            .findSingle({ id: serverToBeClonedId })
            .then(compute.servers().findCredentials)
            .then(_.property('password'))
            .then(clone)
            .then(function (result) {
                assert.equal(result.id, 'de1altdcln03');
                done();
            });
    });

    function clone(password) {
        return compute
            .servers()
            .clone({
                name: "cln",
                description: "Cloned server",
                group: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 },
                        { path: "/data", size: 4 }
                    ]
                },
                from: {
                    serverId: serverToBeClonedId.toUpperCase(),
                    serverPassword: password
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD
            });
    }

});