
var _ = require('underscore');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');
var Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);
var OsFamily = compute.OsFamily;
var DataCenter = compute.DataCenter;

describe('Search templates test [UNIT]', function () {

    //mocked service
    var service = compute.templates();

    function compareIgnoreCase(expected, actual) {
        if (_.isString(expected) && _.isString(actual)) {
            return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
        }

        return false;
    }

    function dataCenterService () {
        return service._dataCenterService();
    }

    before(function(done) {
        Promise
            .all([
                readFile('./test/resources/de1_deployment_capabilities.json'),
                readFile('./test/resources/va1_deployment_capabilities.json'),
                readFile('./test/resources/data_centers_list.json')
            ])
            .then(function(result) {
                var de1Capabilities = JSON.parse(result[0]);
                var va1Capabilities = JSON.parse(result[1]);
                var dataCentersList = JSON.parse(result[2]);

                dataCenterService().getDeploymentCapabilities = function (id) {
                    var capabilities = [];

                    id === 'de1' && (capabilities = de1Capabilities);
                    id === 'va1' && (capabilities = va1Capabilities);

                    return Promise.resolve(capabilities);
                };

                dataCenterService()._dataCenterClient().findAllDataCenters = function () {
                    return Promise.resolve(dataCentersList);
                };
            })
            .then(done);
    });

    it('Should return list of all "de1" templates', function (done) {
        this.timeout(1000 * 60 * 5);

        compute
            .templates()
            .find({
                dataCenterIds: [DataCenter.DE_FRANKFURT.id, "va1"]
            })
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return Windows template in "de1" templates', function (done) {
        this.timeout(1000 * 60 * 5);

        service
            .findByRef({
                dataCenter: DataCenter.DE_FRANKFURT,
                os: OsFamily.WINDOWS,
                version: '2008',
                architecture: compute.Machine.Architecture.X86_64,
                edition: "Enterprise"
            })
            .then(function(result) {
                assert.equal(result.name, "WIN2008R2ENT-64");
            })
            .then(function () {
                done();
            });
    });

    it('Should return centOs template in "de1" templates', function (done) {
        this.timeout(1000 * 60 * 5);

        service
            .find({
                dataCenter: ['de1', 'va1'],
                dataCenterNameContains: ['Frankfurt', 'Seattle'],
                dataCenterWhere: function (metadata) {
                    return metadata.id === 'de1';
                },
                name: ['CENTOS-6-64-TEMPLATE'],
                nameContains: 'CentOs',
                descriptionContains: 'CentOs',
                where: function (template) {
                    return template.osType === 'centOS6_64Bit';
                },
                operatingSystem: {
                    family: OsFamily.CENTOS,
                    version: '6',
                    architecture: compute.Machine.Architecture.X86_64
                }
            })
            .then(function(result) {
                assert.equal(result.length, 1);
                assert.equal(result[0].name, "CENTOS-6-64-TEMPLATE");
            })
            .then(function () {
                done();
            });
    });

    it('Should return WINDOWS and RHEL templates in "de1" and RHEL in "va1', function (done) {
        this.timeout(1000 * 60 * 5);

        compute.templates()
            .find({
                or: [
                    {
                        dataCenter: 'de1',
                        operatingSystem: { family: OsFamily.WINDOWS }
                    },
                    {
                        dataCenter: ['va1', 'de1'],
                        operatingSystem: {family: OsFamily.RHEL}
                    },
                    {
                        or: [
                            {
                                nameContains: 'cent',
                                dataCenterWhere: function(dataCenter) {
                                    return dataCenter.id === 'de1';
                                }
                            },
                            {
                                dataCenterNameContains: 'Sterling',
                                descriptionContains: 'Ubuntu'
                            }
                        ]
                    }
            ]})
            .then(function(result) {
                assert(_.every(result, function(template) {
                    if (['de1', 'va1'].indexOf(template.dataCenter.id) === -1) {
                        return false;
                    }
                    var osType = template.osType;
                    if (template.dataCenter.id === 'va1') {
                        return compareIgnoreCase(OsFamily.RHEL, osType) ||
                            compareIgnoreCase(OsFamily.UBUNTU, osType);
                    } else {
                        return compareIgnoreCase(OsFamily.RHEL, osType) ||
                            compareIgnoreCase(OsFamily.WINDOWS, osType) ||
                            compareIgnoreCase(OsFamily.CENTOS, osType);
                    }
                }), true);
            })
            .then(function () {
                done();
            });
    });

    it('Should return empty result', function (done) {
        this.timeout(1000 * 60 * 5);

        compute.templates()
            .find({
                and: [
                    {
                        dataCenter: 'de1',
                        operatingSystem: {family: OsFamily.WINDOWS}
                    },
                    {
                        dataCenter: ['va1', 'de1'],
                        operatingSystem: {family: OsFamily.RHEL}
                    },
                    {or: [
                        {
                            dataCenterNameContains: 'Frank',
                            name: ['CentOS-6_32Bit']
                        },
                        {
                            dataCenterWhere: function(dataCenter) {
                                return dataCenter.id === 'de1';
                            },
                            nameContains: 'Win'
                        }

                    ]}
                ]})
            .then(TestAsserts.assertThatArrayIsEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return template with cpuAutoscale capability in "de1" templates (by search func)', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .find({
                dataCenter: DataCenter.DE_FRANKFURT,
                where: function(metadata) {
                    return metadata.capabilities.indexOf("cpuAutoscale") > -1;
                }
            })
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(function () {
                done();
            });
    });

});