
var Sdk = require('./../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();

describe('Create server operation', function () {

//    it('Should create new server', function () {
//        compute
//            .servers()
//            .create({
//                name: 'ALTRS',
//                description: 'My Server',
//                type: compute.SERVER.STANDARD,
//                storageType: compute.SERVER_STORAGE.PREMIUM,
//                group: { dataCenter: 'frankfurt', name: compute.GROUP.DEFAULT },
//                template: { os: compute.OS.CENTOS, version: '6' },
//                machine: {
//                    cpu: 2, ram: 1,
//                    disk: [
//                        { path: '/var', size: 16 },
//                        { size: 10 }
//                    ]
//                },
//                network: {
//                    primaryDns: '192.168.1.5',
//                    secondaryDns: '192.168.1.6',
//                    publicIp: {
//                        openPorts: [80, 443, 22, compute.Port.range(22, 25)],
//                        restrictions: '192.168.2.1/244'
//                    }
//                }
//            })
//            .on('job-queue', function (server) {
//
//            })
//            .on('executed', function (result) {
//
//            });
//    });

    it('Should create new server', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .servers()
            .create({
                name: "web",
                description: "My web server",
                groupId: "2dda7958f3ad4d819914e8d3cb643120",
                sourceServerId: "RHEL-6-64-TEMPLATE",
                primaryDns: "172.17.1.26",
                secondaryDns: "172.17.1.27",
                cpu: 2,
                memoryGB: 4,
                type: "standard",
                storageType: "standard"
            })
            .on('job-queue', function (server) {
                // empty
            })
            .on('complete', function (result) {
                done();
            });
    });

});