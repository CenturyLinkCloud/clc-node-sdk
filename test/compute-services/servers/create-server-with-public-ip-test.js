
var _ = require('underscore');
var assert = require('assert');
var vcr = require('nock-vcr-recorder-mocha');

var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

vcr.describe('Create server with publicIp operation [UNIT]', function () {

    it('Should create new server', function (done) {
        this.timeout(10000);

        var DataCenter = compute.DataCenter;
        var Server = compute.Server;
        var Group = compute.Group;

        var promise = compute
            .servers()
            .create({
                name: "webIp",
                description: "My web server",
                group: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                template: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    operatingSystem: {
                        family: compute.OsFamily.CENTOS,
                        version: "6",
                        architecture: compute.Machine.Architecture.X86_64
                    }
                },
                network: {
                    primaryDns: "172.17.1.26",
                    secondaryDns: "172.17.1.27"
                },
                machine: {
                    cpu: 1,
                    memoryGB: 1,
                    disks: [
                        { size: 2 },
                        { path: "/data", size: 4 }
                    ]
                },
                type: Server.STANDARD,
                storageType: Server.StorageType.STANDARD,
                customFields: [
                    {
                        name: "Type",
                        value: 0
                    }
                ],
                publicIp: {
                    openPorts: [
                        Server.Port.HTTP,
                        Server.Port.HTTPS,
                        { from: 8080, to: 8081 },
                        { protocol: Server.Protocol.TCP, port: 23 }
                    ],
                    sourceRestrictions: [
                        '71.100.60.0/24',
                        { ip: '192.168.3.0', mask: '255.255.255.128' }
                    ]
                }
            });

        promise.then(function(server) {
            return compute.servers()
                .findPublicIp(server)
                .then(function(publicIpData) {
                    checkPublicIpData(publicIpData);

                    return server;
                });
        });

        promise.then(_.partial(deleteServer, done));
    });

    function checkPublicIpData(data) {
        assert.equal(data.length, 1);
        var publicIpData = data[0];
        var Server = compute.Server;

        assert(publicIpData.internalIPAddress);

        assert.deepEqual(
            publicIpData.ports,
            [
                { port: Server.Port.HTTP, protocol: Server.Protocol.TCP },
                { port: Server.Port.HTTPS, protocol: Server.Protocol.TCP },
                { port: 8080, portTo: 8081, protocol: Server.Protocol.TCP },
                { port: 23, protocol: Server.Protocol.TCP }
            ]
        );

        assert.deepEqual(
            publicIpData.sourceRestrictions,
            [
                { cidr: '71.100.60.0/24' },
                { cidr: '192.168.3.0/25' }
            ]
        );
    }

    function deleteServer (done, server) {
        compute
            .servers()
            .delete(server)
            .then(function () {
                done();
            });
    }

});