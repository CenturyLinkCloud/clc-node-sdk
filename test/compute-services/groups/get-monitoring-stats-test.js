
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require('underscore');
var MonitoringStatsConverter = require('./../../../lib/compute-services/statistics/domain/monitoring-stats-converter.js');

vcr.describe('Get group monitoring stats [UNIT]', function () {

    var defaultMaxHourlyPeriodDays = MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS;
    var defaultRealtimePeriodHours = MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS;

    before(function() {
        /* it is necessary to cassette usage */
        MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS = 100000;
        MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS = 1000000;
    });

    after(function() {
        MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS = defaultMaxHourlyPeriodDays;
        MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS = defaultRealtimePeriodHours;
    });

    var defaultGroupCriteria = {
        dataCenter: compute.DataCenter.US_EAST_STERLING,
        name: compute.Group.DEFAULT
    };

    it('Should return latest stats for Default group in VA1', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .getMonitoringStats(
                defaultGroupCriteria,
                {
                    type: compute.MonitoringStatsType.LATEST
                }
            )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(stats) {
            assert.equal(stats.length, 1);

            var groupStats = stats[0];
            assert.notEqual(groupStats.length, 0);
            assert.equal(groupStats.group.name, compute.Group.DEFAULT);

            var serverStats = groupStats.servers[0];
            assert.notEqual(serverStats.name, undefined);
            assert.notEqual(serverStats.stats, undefined);
            assert.equal(serverStats.stats.length, 1);
            assert.notEqual(serverStats.stats[0], undefined);
        }
    });

    it('Should return hourly stats for Default group in VA1', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .getMonitoringStats(
                defaultGroupCriteria,
                {
                    start: '2015-07-23T18:00:00',
                    end: '2015-07-23T20:00:00',
                    sampleInterval: '02:00:00',
                    type: compute.MonitoringStatsType.HOURLY
                }
            )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(stats) {
            assert.equal(stats.length, 1);

            var groupStats = stats[0];
            assert.notEqual(groupStats.length, 0);
            assert.equal(groupStats.group.name, compute.Group.DEFAULT);

            var serverStats = groupStats.servers[0];
            assert.notEqual(serverStats.name, undefined);
            assert.notEqual(serverStats.stats, undefined);
            assert.equal(serverStats.stats.length, 2);
            assert.notEqual(serverStats.stats[0], undefined);
            assert.notEqual(serverStats.stats[1], undefined);
        }
    });

    it('Should return realtime stats for Default group in VA1', function (done) {
        this.timeout(10000);

        compute
            .groups()
            .getMonitoringStats(
            defaultGroupCriteria,
            {
                start: '2015-07-23T15:00:00',
                end: '2015-07-23T15:15:00',
                sampleInterval: '05:00',
                type: compute.MonitoringStatsType.REALTIME
            }
        )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(stats) {
            assert.equal(stats.length, 1);

            var groupStats = stats[0];
            assert.notEqual(groupStats.length, 0);
            assert.equal(groupStats.group.name, compute.Group.DEFAULT);

            var serverStats = groupStats.servers[0];
            assert.notEqual(serverStats.name, undefined);
            assert.notEqual(serverStats.stats, undefined);
            assert.equal(serverStats.stats.length, 3);
            assert.notEqual(serverStats.stats[0], undefined);
            assert.notEqual(serverStats.stats[1], undefined);
            assert.notEqual(serverStats.stats[2], undefined);
        }
    });
});