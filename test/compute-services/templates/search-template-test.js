var vcr = require('nock-vcr-recorder-mocha');

var _ = require('underscore');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');


vcr.describe('Search templates operation [UNIT]', function () {
    var OsFamily = compute.OsFamily;
    var DataCenter = compute.DataCenter;

    var service = compute.templates();

    var timeout = 10 * 1000;

    function compareIgnoreCase(expected, actual) {
        if (_.isString(expected) && _.isString(actual)) {
            return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
        }

        return false;
    }

    it('Should return list of all de1 templates', function (done) {
        this.timeout(timeout);

        compute
            .templates()
            .find({
                dataCenterId: [DataCenter.DE_FRANKFURT.id, "va1"]
            })
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return centOs template in de1 templates', function (done) {
        this.timeout(timeout);

        service
            .find({
                dataCenterId: ['de1', 'va1'],
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

    it('Should return WINDOWS and RHEL templates in de1 and RHEL in va1', function (done) {
        this.timeout(timeout);

        compute.templates()
            .find({
                or: [
                    {
                        dataCenterId: 'de1',
                        operatingSystem: { family: OsFamily.WINDOWS }
                    },
                    {
                        dataCenterId: ['va1', 'de1'],
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
        this.timeout(timeout);

        compute.templates()
            .find({
                and: [
                    {
                        dataCenterId: 'de1',
                        operatingSystem: {family: OsFamily.WINDOWS}
                    },
                    {
                        dataCenterId: ['va1', 'de1'],
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

    it('Should not found any template by incorrect criteria', function (done) {
        this.timeout(timeout);

        compute.templates()
            .find({
                dataCenterId: 'fakeId'
            })
            .then(TestAsserts.assertThatArrayIsEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return template with cpuAutoscale capability in de1 templates (by search func)', function (done) {
        this.timeout(timeout);

        compute
            .templates()
            .find({
                dataCenter: [DataCenter.DE_FRANKFURT],
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