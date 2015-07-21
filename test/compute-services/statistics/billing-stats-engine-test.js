
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Get aggregated billing stats [UNIT]', function () {

    var DataCenter = compute.DataCenter;
    var Group = compute.Group;
    var Resource = compute.Resource;

    var defaultGroupCriteria = {
        dataCenter: DataCenter.US_EAST_STERLING,
        name: Group.DEFAULT
    };

    var timeout = 10000;

    it('Should return stats for Default group in VA1 aggregated by group', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .billingStats({
                group: defaultGroupCriteria,
                groupBy: Resource.GROUP,
                aggregateSubItems: true
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 2);

            var defaultGroupData = statsData[0];
            var subGroupData = statsData[1];

            assert.equal(defaultGroupData.entity.name, Group.DEFAULT);
            assert.equal(defaultGroupData.entity.locationId.toLowerCase(), DataCenter.US_EAST_STERLING.id);
            assert.deepEqual(defaultGroupData.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 23.669999999999998,
                monthToDate: 1.7999999999999998,
                currentHour: 0.08571000000000001
            });

            assert.equal(subGroupData.entity.name, 'Subgroup');
            assert.equal(subGroupData.entity.locationId.toLowerCase(), DataCenter.US_EAST_STERLING.id);
            assert.deepEqual(subGroupData.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 0,
                monthToDate: 0,
                currentHour: 0
            });
        }
    });

    it('Should return stats for Default group in VA1 aggregated by server', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .billingStats({
                group: defaultGroupCriteria,
                groupBy: Resource.SERVER
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 3);

            var server1Data = statsData[0];
            var server2Data = statsData[1];
            var server3Data = statsData[2];

            assert.equal(server1Data.entity.id, 'va1altdst-101');
            assert.deepEqual(server1Data.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 7.89,
                monthToDate: 0.6,
                currentHour: 0.02857
            });

            assert.equal(server2Data.entity.id, 'va1altdst-201');
            assert.deepEqual(server2Data.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 7.89,
                monthToDate: 0.6,
                currentHour: 0.02857
            });

            assert.equal(server3Data.entity.id, 'va1altdst-301');
            assert.deepEqual(server3Data.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 7.89,
                monthToDate: 0.6,
                currentHour: 0.02857
            });
        }
    });

    it('Should return stats for Default group in VA1 aggregated by datacenter', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .billingStats({
                group: defaultGroupCriteria,
                groupBy: Resource.DATACENTER
            })
            .then(checkStatsData)
            .then(done);

            function checkStatsData(statsData) {
                assert.equal(statsData.length, 1);
                var data = statsData[0];

                assert.equal(data.entity.id, DataCenter.US_EAST_STERLING.id);
                assert.deepEqual(data.statistics, {
                    archiveCost: 0,
                    templateCost: 0,
                    monthlyEstimate: 23.669999999999998,
                    monthToDate: 1.7999999999999998,
                    currentHour: 0.08571000000000001
                });
            }
    });

    it('Should return summarized stats for VA1 datacenter', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .billingStats({
                dataCenter: {
                    id: DataCenter.US_EAST_STERLING.id
                },
                groupBy: Resource.GROUP,
                summarize: true
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.deepEqual(statsData, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 23.669999999999998,
                monthToDate: 1.7999999999999998,
                currentHour: 0.08571000000000001
            });
        }
    });

    it('Should return stats for st-101 server', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .billingStats({
                server: {
                    id: 'va1altdst-101'
                },
                groupBy: Resource.SERVER
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 1);
            var serverData = statsData[0];

            assert.equal(serverData.entity.id, 'va1altdst-101');
            assert.deepEqual(serverData.statistics, {
                archiveCost: 0,
                templateCost: 0,
                monthlyEstimate: 7.89,
                monthToDate: 0.6,
                currentHour: 0.02857
            });
        }
    });

});