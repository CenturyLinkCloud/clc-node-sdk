
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");

describe('Search templates test [INTEGRATION, LONG_RUNNING]', function () {

    it('Should return list of all "de1" templates', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .find({
                dataCenterIds: [compute.DataCenter.DE_FRANKFURT.id, "ca1"]
            })
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return centOs template in "de1" templates', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .findByRef({
                dataCenter: ['de1', 'ca2'],
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
            .then(TestAsserts.assertThatResultNotEmpty)
            .then(function () {
                done();
            });
    });

    it('Should return template with cpuAutoscale capability in "de1" templates (by search func)', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .findByRef({
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