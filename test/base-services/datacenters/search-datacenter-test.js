var vcr = require('nock-vcr-recorder-mocha');

var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().baseServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');

vcr.describe('Search datacenter operation [UNIT]', function () {
    var assertThatDataCenterIsDe1 = TestAsserts.assertThatDataCenterIsDe1;
    var assertThatArrayIsEmpty = TestAsserts.assertThatArrayIsEmpty;

    it('Should found de1 datacenter by filter criteria', function (done) {
        this.timeout(10000);

        compute.dataCenters()
            .find({
                id: ['de1'],
                nameContains: "de",
                where: function(metadata) {
                    return metadata.id === 'de1';
                }
            })
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found ca1 datacenter by conditional criteria', function (done) {
        this.timeout(10000);

        var criteria = {
            and: [
                { nameContains: 'CA' },
                { name: 'CA1 - Canada (Vancouver)' },
                { and: [{ nameContains: 'Canada' }, { id: 'ca1' }] }
            ]
        };

        compute.dataCenters()
            .find(criteria)
            .then(function(result) {
                assert.equal(result.length, 1);
                assert.equal(result[0].id, 'ca1');
            })
            .then(function () {
                done();
            });
    });

    it('Should not found any data center', function (done) {
        this.timeout(10000);

        var criteria = {
            and: [
                { nameContains: 'DE' },
                { and: [{id: 'ca1'}] }
            ]
        };

        compute.dataCenters()
            .find(criteria)
            .then(assertThatArrayIsEmpty)
            .then(function () {
                done();
            });
    });

    it('Should found all data centers', function (done) {
        this.timeout(10000);

        compute.dataCenters()
            .find()
            .then(function (result) {
                assert.equal(result.length > 0, true);
                done();
            });
    });
});