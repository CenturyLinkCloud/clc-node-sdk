
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var TestAsserts = require("./../../test-asserts.js");
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search group by name and datacenter [UNIT]', function () {
    var assertThatGroupIsDefault = TestAsserts.assertThatGroupIsDefault;

    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    it('Should found Default group', function (done) {
        this.timeout(100000);

        compute
            .groups()
            .findByNameAndDatacenter({
                dataCenter: DataCenter.DE_FRANKFURT,
                name: Group.DEFAULT
            })
            .then(assertThatGroupIsDefault)
            .then(function () {
                done();
            });
    });

    it('Should found Default group in DE1', function (done) {
        this.timeout(100000);

        compute
            .groups()
            .find({
                id: ['2dda7958f3ad4d819914e8d3cb643120'],
                name: ["test", Group.DEFAULT],
                nameContains: ["group", "default"],
                //description: "",
                //descriptionContains: ["My", "Test"],
                where: function(metadata) {
                    return metadata.name === 'Default Group';
                },
                dataCenter: {
                    id: ['de1', 'va1'],
                    name: 'DE1 - Germany (Frankfurt)',
                    nameContains: ['Frankfurt', 'Seattle'],
                    where: function (metadata) {
                        return metadata.id === 'de1';
                    }
                },
                dataCenterId: DataCenter.DE_FRANKFURT.id,
                dataCenterName: DataCenter.DE_FRANKFURT.name
            })
            .then(function(result) {
                return result[0];
            })
            .then(assertThatGroupIsDefault)
            .then(function () {
                done();
            });
    });

    it('Should found Default groups in different data centers with composite dataCenter criteria', function (done) {
        this.timeout(100000);

        compute
            .groups()
            .find({
                name: [Group.DEFAULT],
                dataCenter: [
                    {id: ['de1']},
                    {nameContains: 'Seattle'}
                ],
                dataCenterId: compute.DataCenter.CA_TORONTO_1.id
            })
            .then(function(result) {
                assert.equal(result.length, 3);
                _.each(result, assertThatGroupIsDefault);
            })
            .then(function () {
                done();
            });
    });

    it('Should not found any group', function (done) {
        this.timeout(100000);

        compute
            .groups()
            .find({
                name: [Group.DEFAULT],
                descriptionContains: "blah",
                dataCenter: [
                    {id: ['de1']},
                    {nameContains: 'Seattle'}
                ],
                dataCenterId: compute.DataCenter.CA_TORONTO_1.id
            })
            .then(function(result) {
                assert.equal(result.length, 0);
            })
            .then(function () {
                done();
            });
    });

    it('Should found Archive group with composite group criteria', function (done) {
        this.timeout(100000);

        compute
            .groups()
            .find({
                or: [
                    {
                        name: Group.ARCHIVE,
                        dataCenterId: 'de1'
                    },
                    {
                        description: "123test123",
                        dataCenter: [{id:'test'}, {nameContains: 'blah'}]
                    }
                ]
            })
            .then(function(result) {
                assert.equal(result.length, 1);
                assert.equal(result[0].name, Group.ARCHIVE);
                assert.equal(result[0].locationId, "DE1");
            })
            .then(function () {
                done();
            });
    });

});