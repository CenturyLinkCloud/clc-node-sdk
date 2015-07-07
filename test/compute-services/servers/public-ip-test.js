
var Sdk = require('./../../../lib/clc-sdk.js');

var vcr = require('nock-vcr-recorder-mocha');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();

var _ = require('underscore');
var assert = require('assert');

var Port = require('../../../lib/compute-services/servers/domain/port.js');
var Protocol = require('../../../lib/compute-services/servers/domain/protocol.js');


vcr.describe('Public IP Address Operations [UNIT]', function () {

    var searchCriteria = {
        dataCenter: compute.DataCenter.DE_FRANKFURT,
        nameContains: 'web580'
    };

    var publicIpConfig = {
        openPorts: [
            Port.HTTP,
            Port.HTTPS,
            { from: 8080, to: 8081 },
            { protocol: Protocol.TCP, port: 23 }
        ],
        sourceRestrictions: [
            '71.100.60.0/24',
            { ip: '192.168.3.0', mask: '255.255.255.128' }
        ]
    };

    it('Should add public ip', function (done) {
        this.timeout(10000);

        compute.servers()
            .addPublicIp(searchCriteria, publicIpConfig)
            .then(function (serverRefs) {
                assert.equal(serverRefs != null, true);

                return compute.servers().find(serverRefs);
            })
            .then(function(servers) {
                _.each(servers, function(server) {
                    assert.equal(server.details.ipAddresses.length, 2);
                });
            })
            .then(done);
    });

    it('Should find all public ip data', function (done) {
        this.timeout(10000);

        compute.servers()
            .findPublicIp(searchCriteria)
            .then(function(publicIpData) {
                checkPublicIpData(publicIpData);
            })
            .then(done);
    });

    function checkPublicIpData(data) {
        assert.equal(data.length, 1);
        var publicIpData = data[0];

        assert(publicIpData.internalIPAddress);
        assert.deepEqual(
            publicIpData.ports,
            [
                { port: Port.HTTP, protocol: Protocol.TCP },
                { port: Port.HTTPS, protocol: Protocol.TCP },
                { port: 8080, portTo: 8081, protocol: Protocol.TCP },
                { port: 23, protocol: Protocol.TCP }
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
});