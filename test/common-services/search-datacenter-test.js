
var assert = require('assert');
var Sdk = require('./../../lib/clc-sdk.js');
var common = new Sdk().commonServices();

describe('Search datacenter by reference', function () {

    it('Should found "de1" datacenter by id', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ id: 'de1'})
            .then(function(result) {
                checkAsserts(result);
            })
            .then(function () {
                done();
            });
    });

    it('Should found "de1" datacenter by name substring', function (done) {
        this.timeout(10000);

        common
            .dataCenters()
            .findByRef({ name: 'Frankfurt'})
            .then(function(result) {
                checkAsserts(result);
            })
            .then(function () {
                done();
            });
    });

    var checkAsserts = function(result) {
        assert.equal(result.length, 1);
        assert.equal(result[0].id, "de1");
        assert.equal(result[0].name, "DE1 - Germany (Frankfurt)");
    }

});