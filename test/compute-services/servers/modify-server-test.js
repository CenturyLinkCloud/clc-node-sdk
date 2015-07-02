
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
                },
                customFields: [
                    {
                        name: "Type",
                        value: 1
                    }
                ]
            })
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(modifiedServers) {
                var modifiedServer = modifiedServers[0];
                assert.equal(modifiedServer.details.cpu, newCpu);
                assert.equal(modifiedServer.details.memoryMB, newMemory*1024);
                assert.equal(modifiedServer.locationId, "DE1");

                assertDisks(modifiedServer);

                assertCustomFields(modifiedServer);

                return modifiedServer;
            })
            .then(function(modifiedServer) {
                return compute.servers().findCredentials({id: modifiedServer.id});
            })
            .then(_.property('password'))
            .then(_.partial(assert.equal, '!QWE123rty1'))
            .then(done);
    });

    function assertDisks(modifiedServer) {
        var details = modifiedServer.details;

        assert.equal(details.diskCount, 5);
        assert.equal(_.findWhere(details.disks, {id:'0:4'}), undefined);
        assert.equal(_.findWhere(details.disks, {id:'0:1'}).sizeGB, 3);
        assert.equal(_.findWhere(details.disks, {id:'0:3'}).sizeGB, 3);
    }

    function assertCustomFields(modifiedServer) {
        var customFields = modifiedServer.details.customFields;

        assert.equal(customFields.length, 1);
        assert.equal(customFields[0].value, 1);
    }
});