
var Sdk = require('./../../lib/clc-sdk.js');
var compute = new Sdk().computeService();


describe('Create server command', function () {

    it('Should create new server', function () {
        compute
            .servers()
            .create({
                name: 'ALTRS',
                description: 'My Server',
                type: compute.SERVER.STANDARD,
                storageType: compute.SERVER_STORAGE.PREMIUM,
                group: { dataCenter: 'frankfurt', name: compute.GROUP.DEFAULT },
                template: { os: compute.OS.CENTOS, version: '6' },
                machine: {
                    cpu: 2, ram: 1,
                    disk: [
                        { path: '/var', size: 16 },
                        { size: 10 }
                    ]
                },
                network: {
                    primaryDns: '192.168.1.5',
                    secondaryDns: '192.168.1.6',
                    publicIp: {
                        openPorts: [80, 443, 22, compute.Port.range(22, 25)],
                        restrictions: '192.168.2.1/244'
                    }
                }
            })
            .on('called', function (server) {

            })
            .on('executed', function (result) {

            });
    });

    it('Should find server by ID reference', function (done) {
        compute.servers()
            .findByRef({ id: 'DE1ALTDCTTL577' })
            .then(console.log)
            .then(function () {
                done();
            });
    });

});