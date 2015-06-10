var Sdk = require('./../../../lib/clc-sdk.js');
var common = new Sdk().commonServices();
var TestAsserts = require("./../../test-asserts.js");
var Promise = require("bluebird");
var fs = require('fs');

describe('Search datacenter by reference [UNIT]', function () {
    var assertThatDataCenterIsDe1 = new TestAsserts().assertThatDataCenterIsDe1;
    var assertThatArrayIsEmpty = new TestAsserts().assertThatArrayIsEmpty;
    var dataCenters = [];
    var service;

    before(function(done) {
        fs.readFile('./test/common-services/datacenters/data_centers_list.json', function(err, data) {
            dataCenters = JSON.parse(data);

            service = common.dataCenters();
            service._dataCenterClient().findAllDataCenters = function() {
                return Promise.resolve(dataCenters);
            };

            done();
        });
    });

    it('Should found "de1" datacenter by id', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ id: "de1" })
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by name substring', function (done) {
        this.timeout(10000);

        service
            .findByRef({ name: 'Frankfurt'})
            .then(assertThatDataCenterIsDe1)
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by filter criteria', function (done) {
        this.timeout(10000);

        service
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

        var criteria = {
            and: [
                { nameContains: 'DE' },
                { and: [{ nameContains: 'Germany' }, { id: 'de1' }] }
            ]
        };

        service.find(criteria)
            .then(assertThatDataCenterIsDe1)
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

        service.find(criteria)
            .then(assertThatArrayIsEmpty)
            .then(function () {
                done();
            });
    });
});