
var Sdk = require('./../../../lib/clc-sdk.js');
var common = new Sdk().commonServices();
var TestAsserts = require("./../../test-asserts.js");
var JsMockito = require('jsmockito').JsMockito;
var Promise = require("bluebird");

describe('Search datacenter by reference [INTEGRATION]', function () {
    var assertThatDataCenterIsDe1 = new TestAsserts().assertThatDataCenterIsDe1;

    it('Should found "de1" datacenter by id', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ id: 'de1'})
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by name substring', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ name: 'Frankfurt'})
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by filter criteria', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
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

    it('Should found "de1" datacenter by conditional criteria', function (done) {
        this.timeout(10000);

        var mockedFindFn = JsMockito.spy(common.dataCenters().find);
        var criteria = {
            and:[
                {nameContains:'DE'},
                {and:[
                    {nameContains:'Germany'},
                    {id:'de1'}
                ]
                }
            ]
        };

        JsMockito.when(mockedFindFn)(criteria).thenReturn(Promise.resolve(common.DataCenter.DE_FRANKFURT));

        mockedFindFn(criteria)
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });
});