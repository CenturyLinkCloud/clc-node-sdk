
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var TestAsserts = require("./../../../test-asserts.js");
var assert = require('assert');
var _ = require("underscore");

vcr.describe('Search group operation [UNIT]', function () {
    var assertThatGroupIsDefault = TestAsserts.assertThatGroupIsDefault;

    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    var timeout = 10000;

    it('Should found Default group', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .find({
                dataCenter: DataCenter.DE_FRANKFURT,
                name: Group.DEFAULT
            })
            .then(_.first)
            .then(assertThatGroupIsDefault)
            .then(done);
    });

    it('Should found Default group in DE1', function (done) {
        this.timeout(timeout);

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
            .get(0)
            .then(assertThatGroupIsDefault)
            .then(function () {
                done();
            });
    });

    it('Should found root group in DE1', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .find({
                dataCenter: compute.DataCenter.DE_FRANKFURT,
                rootGroup: true
            })
            .then(function(result) {
                assert.equal(result.length, 1);

                return result;
            })
            .get(0)
            .then(function(result) {
                assert.equal(result.name, 'DE1 Hardware');
            })
            .then(function () {
                done();
            });
    });

    it('Should found Default groups in different data centers with composite dataCenter criteria', function (done) {
        this.timeout(timeout);

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
        this.timeout(timeout);

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
        this.timeout(timeout);

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

    it('Should found default and archive groups in de1 with composite group criteria', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .find({
                and: [
                    {or: [
                        {
                            id: "2dda7958f3ad4d819914e8d3cb643120"
                        },
                        {
                            name: Group.ARCHIVE
                        }
                    ]},
                    {
                        dataCenter: {id:'de1'}
                    }
                ]
            })
            .then(function(result) {
                assert.equal(result.length, 2);
                assert.equal(_.chain(result).pluck('locationId').uniq().value(), "DE1");

                var groupNames = _.chain(result).pluck('name').value();
                assert.equal(_.contains(groupNames, Group.DEFAULT), true);
                assert.equal(_.contains(groupNames, Group.ARCHIVE), true);
            })
            .then(function () {
                done();
            });
    });

    it('Should found all groups', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .find()
            .then(function (result) {
                assert.equal(result.length > 0, true);
                done();
            });
    });

});