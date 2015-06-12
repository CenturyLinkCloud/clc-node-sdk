
var _ = require('underscore');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');
var Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);

describe('Search templates test [INTEGRATION, LONG_RUNNING]', function () {

    var de1Capabilities = [];
    var va1Capabilities = [];
    //mocked service
    var service;

    function compareIgnoreCase(expected, actual) {
        if (_.isString(expected) && _.isString(actual)) {
            return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
        }
        return false;

    }

    before(function(done) {
        Promise.all([
            readFile('./test/resources/de1_deployment_capabilities.json'),
            readFile('./test/resources/va1_deployment_capabilities.json')
        ])
            .then(function(result) {
                de1Capabilities = JSON.parse(result[0]);
                va1Capabilities = JSON.parse(result[1]);
            })
            .then(function() {
                service = compute.templates();

                service._dataCenterService().getDeploymentCapabilities = function(id) {
                    var capabilities = [];
                    if (id === 'de1') {
                        capabilities = de1Capabilities;
                    }
                    if (id === 'va1') {
                        capabilities = va1Capabilities;
                    }
                    return Promise.resolve(capabilities);
                };
            })
            .then(done);
    });

    it('Should return list of all "de1" templates', function (done) {
        this.timeout(1000 * 60 * 5);

        compute
            .templates()
            .find({
                dataCenterIds: [compute.DataCenter.DE_FRANKFURT.id, "va1"]
            })
            .then(TestAsserts.assertThatResultNotEmpty)
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
                    family: compute.Os.CENTOS,
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
                        operatingSystem: {family: compute.Os.WINDOWS}
                    },
                    {
                        dataCenter: ['va1', 'de1'],
                        operatingSystem: {family: compute.Os.RHEL}
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
                        return compareIgnoreCase(compute.Os.RHEL, osType) ||
                            compareIgnoreCase(compute.Os.UBUNTU, osType);
                    } else {
                        return compareIgnoreCase(compute.Os.RHEL, osType) ||
                            compareIgnoreCase(compute.Os.WINDOWS, osType) ||
                            compareIgnoreCase(compute.Os.CENTOS, osType);
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
                        operatingSystem: {family: compute.Os.WINDOWS}
                    },
                    {
                        dataCenter: ['va1', 'de1'],
                        operatingSystem: {family: compute.Os.RHEL}
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
                dataCenter: compute.DataCenter.DE_FRANKFURT,
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