
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var moment = require('moment');
var util = require('util');
var MonitoringStatsConverter = require('./../../../lib/compute-services/statistics/domain/monitoring-stats-converter.js');

describe('Monitoring stats converter [UNIT]', function () {

    var converter = new MonitoringStatsConverter();

    it('Should throw validation exceptions', function () {
        try {
            converter.validateAndConvert({
                start: moment()
                    .format(converter.TIME_FORMAT),
                end: moment()
                    .subtract(1, 'minutes')
                    .format(converter.TIME_FORMAT),
                sampleInterval: '02:00:00',
                type: compute.MonitoringStatsType.HOURLY
            });
        } catch(error) {
            assert.equal(error, '"start" cannot be later than "end"');
        }

        try {
            converter.validateAndConvert({
                start: '1915-07-23T12:00:00',
                sampleInterval: '03:00:00',
                type: compute.MonitoringStatsType.HOURLY
            });
        } catch(error) {
            assert.equal(error, util.format(
                    '"start" should be within the past %s day(s)',
                    converter.MAX_HOURLY_PERIOD_DAYS)
            );
        }

        try {
            converter.validateAndConvert({
                start: '1915-07-23T12:00:00',
                end: moment()
                    .format(converter.TIME_FORMAT),
                sampleInterval: '50:00',
                type: compute.MonitoringStatsType.REALTIME
            });
        } catch(error) {
            assert.equal(error, util.format(
                    '"start" should be within the past %s hour(s)',
                    converter.MAX_REALTIME_PERIOD_HOURS)
            );
        }

        try {
            converter.validateAndConvert({
                start: moment()
                    .subtract(2, 'hours')
                    .format(converter.TIME_FORMAT),
                end: moment()
                    .format(converter.TIME_FORMAT),
                sampleInterval: '50:00',
                type: compute.MonitoringStatsType.HOURLY
            });
        } catch(error) {
            assert.equal(error, util.format(
                    '"sampleInterval" should be not less than %s hour(s)',
                    converter.MIN_HOURLY_INTERVAL_HOURS)
            );
        }

        try {
            converter.validateAndConvert({
                start: moment().format(converter.TIME_FORMAT),
                sampleInterval: '00:01',
                type: compute.MonitoringStatsType.REALTIME
            });
        } catch(error) {
            assert.equal(error, util.format(
                    '"sampleInterval" should be not less than %s minute(s)',
                    converter.MIN_REALTIME_INTERVAL_MINUTES)
            );
        }

        try {
            converter.validateAndConvert({
                start: moment()
                    .subtract(1, 'hours')
                    .format(converter.TIME_FORMAT),
                end: moment()
                    .format(converter.TIME_FORMAT),
                sampleInterval: '02:00:00',
                type: compute.MonitoringStatsType.HOURLY
            });
        } catch(error) {
            assert.equal(error, 'Interval should fit within start/end date');
        }

        try {
            converter.validateAndConvert({
                end: moment()
                    .format(converter.TIME_FORMAT),
                sampleInterval: '00:10',
                type: compute.MonitoringStatsType.REALTIME
            });
        } catch(error) {
            assert.equal(error, '"start" should be specified');
        }

        try {
            converter.validateAndConvert({
                start: moment()
                    .subtract(1, 'hours')
                    .format(converter.TIME_FORMAT),
                end: moment()
                    .format(converter.TIME_FORMAT),
                sampleInterval: 'bla-bla:20',
                type: compute.MonitoringStatsType.REALTIME
            });
        } catch(error) {
            assert.equal(error, 'Incorrect "sampleInterval" format');
        }

        try {
            converter.validateAndConvert({
                start: '2115-07-23T12:00:00',
                sampleInterval: 'bla-bla:20',
                type: compute.MonitoringStatsType.HOURLY
            });
        } catch(error) {
            assert.equal(error, '"start" can not be in future');
        }

    });

});