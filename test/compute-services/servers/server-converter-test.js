var _ = require('underscore');
var moment = require('moment');
var assert = require('assert');

var ServerConverter = require('./../../../lib/compute-services/servers/domain/create-server-converter.js');

describe('Server converter test [UNIT]', function() {
    var converter = new ServerConverter();

    it('Should convert ttl property from Date', function (done) {
        var ttlDate = new Date();
        var command = converter.convertTtl({ttl: ttlDate});
        assert.equal(ttlDate.toISOString(), command.ttl);

        done();
    });

    it('Should convert ttl property from Number', function (done) {
        var ttlHour = 5;
        var command = converter.convertTtl({ttl: ttlHour});
        assert.equal(moment().hour() + ttlHour, moment(command.ttl).hour());

        done();
    });

    it('Should convert ttl property from Moment', function (done) {
        var ttlMoment = moment().add(2, 'd');
        var command = converter.convertTtl({ttl: ttlMoment});
        assert.equal(ttlMoment.toISOString(), command.ttl);

        done();
    });

    it('Should convert ttl property from String', function (done) {
        var ttlString = new Date().toISOString();
        var command = converter.convertTtl({ttl: ttlString});
        assert.equal(ttlString, command.ttl);

        done();
    });

    it('Should throw Error if provide incorrect String', function(done) {
        assert.throws(
            function() {
                converter.convertTtl({ttl: "foo"});
            },
            /correct format/
        );

        done();
    });

    it('Should throw Error if provide not supported object', function(done) {
        assert.throws(
            function() {
                converter.convertTtl({ttl: {}});
            },
            /correct format/
        );

        done();
    });
});