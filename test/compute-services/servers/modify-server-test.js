
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');


vcr.describe('Modify server operation [UNIT]', function () {
    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    it('Should modify server', function (done) {
        this.timeout(10000);

        var newMemory = 2;
        var newCpu = 2;

        compute.servers()
            .modify(
            {id: 'de1altdweb580'},
            {
                description: "My web server",
                group: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                cpu: newCpu,
                memory: newMemory,
                password: {
                    old: "!QWE123rty",
                    new: "!QWE123rty1"
                },
                disks: {
                    add: {
                        "path":"/temp",
                        "size":"1",
                        "type":"partitioned"
                    },
                    edit: [{
                        "id":"0:1",
                        "size":3
                    },
                    {
                        "id":"0:3",
                        "size":3
                    }],
                    remove: '0:4'
                }
            })
            .then(function (serverIds) {
                assert.equal(serverIds != null, true);

                return compute.servers().find({id: serverIds});
            })
            .then(function(modifiedServers) {
                var modifiedServer = modifiedServers[0];
                assert.equal(modifiedServer.details.cpu, newCpu);
                assert.equal(modifiedServer.details.memoryMB, newMemory*1024);
                assert.equal(modifiedServer.locationId, "DE1");

                assert.equal(modifiedServer.details.diskCount, 5);
                assert.equal(_.findWhere(modifiedServer.details.disks, {id:'0:4'}), undefined);
                assert.equal(_.findWhere(modifiedServer.details.disks, {id:'0:1'}).sizeGB, 3);
                assert.equal(_.findWhere(modifiedServer.details.disks, {id:'0:3'}).sizeGB, 3);

                return modifiedServer;
            })
            .then(function(modifiedServer) {
                return compute.servers().findCredentials({id: modifiedServer.id});
            })
            .then(_.property('password'))
            .then(_.partial(assert.equal, '!QWE123rty1'))
            .then(done);
    });
});