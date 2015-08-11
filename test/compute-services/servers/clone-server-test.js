
var _ = require('underscore');
var assert = require('assert');
var vcr = require('nock-vcr-recorder-mocha');

var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var DataCenter = compute.DataCenter;
var Server = compute.Server;
var Group = compute.Group;

vcr.describe('Clone server operation [UNIT]', function () {

    it('Should clone created server', function (done) {
        this.timeout(10000);

        var serverToBeClonedId = 'de1altdweb598';

        compute.servers()
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
                    server: { id: serverToBeClonedId }
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD
            })
            .then(function (result) {
                assert.equal(result.id, 'de1altdcln04');

                done();
            });
    });

});