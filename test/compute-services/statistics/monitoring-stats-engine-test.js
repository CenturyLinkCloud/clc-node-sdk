
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');

vcr.describe('Get aggregated monitoring stats [UNIT]', function () {

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
            .monitoringStats({
                group: defaultGroupCriteria,
                groupBy: Resource.GROUP,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                }
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 1);
            var groupStatsData = statsData[0];

            assert.equal(groupStatsData.entity.name, Group.DEFAULT);
            assert.equal(groupStatsData.entity.locationId.toLowerCase(), DataCenter.US_EAST_STERLING.id);

            assert.deepEqual(groupStatsData.statistics, [
                {
                    "timestamp": "2015-07-30T08:18:40Z",
                    "cpu": 3,
                    "cpuPercent": 0.26,
                    "memoryMB": 3072,
                    "memoryPercent": 1.99,
                    "networkReceivedKBps": 0,
                    "networkTransmittedKBps": 0,
                    "diskUsageTotalCapacityMB": 50688,
                    "diskUsage": [
                        {"id": "0:0", "capacityMB": 1536},
                        {"id": "0:1", "capacityMB": 6144},
                        {"id": "0:2", "capacityMB": 43008}
                    ],
                    "guestDiskUsage": [
                        {"path": "/", "capacityMB": 41949, "consumedMB": 3948},
                        {"path": "/boot", "capacityMB": 1482, "consumedMB": 324}
                    ]
                }
            ]);
        }
    });

    it('Should return stats for Default group in VA1 aggregated by server', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .monitoringStats({
                group: defaultGroupCriteria,
                groupBy: Resource.SERVER,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                }
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 3);

            var server1Stats = statsData[0];
            var server2Stats = statsData[1];
            var server3Stats = statsData[2];

            assert.equal(server1Stats.entity.id, 'va1altdst-101');
            assert.equal(server2Stats.entity.id, 'va1altdst-201');
            assert.equal(server3Stats.entity.id, 'va1altdst-301');

            assert.deepEqual(server1Stats.statistics, [{
                "timestamp": "2015-07-30T08:42:40Z",
                "cpu": 1,
                "cpuPercent": 0.25,
                "memoryMB": 1024,
                "memoryPercent": 3.32,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 16896,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 512},
                    {"id": "0:1", "capacityMB": 2048},
                    {"id": "0:2", "capacityMB": 14336}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 13983, "consumedMB": 1316},
                    {"path": "/boot", "capacityMB": 494, "consumedMB": 108}
                ]
            }]);

            assert.deepEqual(server2Stats.statistics, [{
                "timestamp": "2015-07-30T08:42:40Z",
                "cpu": 1,
                "cpuPercent": 0.24,
                "memoryMB": 1024,
                "memoryPercent": 2,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 16896,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 512},
                    {"id": "0:1", "capacityMB": 2048},
                    {"id": "0:2", "capacityMB": 14336}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 13983, "consumedMB": 1316},
                    {"path": "/boot", "capacityMB": 494, "consumedMB": 108}
                ]}
            ]);

            assert.deepEqual(server3Stats.statistics, [{
                "timestamp": "2015-07-30T08:42:40Z",
                "cpu": 1,
                "cpuPercent": 0.27,
                "memoryMB": 1024,
                "memoryPercent": 2.49,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 16896,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 512},
                    {"id": "0:1", "capacityMB": 2048},
                    {"id": "0:2", "capacityMB": 14336}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 13983, "consumedMB": 1316},
                    {"path": "/boot", "capacityMB": 494, "consumedMB": 108}
                ]}
            ]);
        }
    });

    it('Should return stats for Default group in VA1 aggregated by datacenter', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .monitoringStats({
                group: defaultGroupCriteria,
                groupBy: Resource.DATACENTER,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                }
            })
            .then(checkStatsData)
            .then(done);

            function checkStatsData(statsData) {
                assert.equal(statsData.length, 1);
                var dataCenterStatsData = statsData[0];

                assert.equal(dataCenterStatsData.entity.id, DataCenter.US_EAST_STERLING.id);

                assert.deepEqual(dataCenterStatsData.statistics, [{
                    "timestamp": "2015-07-30T09:18:40Z",
                    "cpu": 3,
                    "cpuPercent": 0.26,
                    "memoryMB": 3072,
                    "memoryPercent": 1.9333333333333333,
                    "networkReceivedKBps": 0,
                    "networkTransmittedKBps": 0,
                    "diskUsageTotalCapacityMB": 50688,
                    "diskUsage": [
                        {"id": "0:0", "capacityMB": 1536},
                        {"id": "0:1", "capacityMB": 6144},
                        {"id": "0:2", "capacityMB": 43008}
                    ],
                    "guestDiskUsage": [
                        {"path": "/", "capacityMB": 41949, "consumedMB": 3948},
                        {"path": "/boot", "capacityMB": 1482, "consumedMB": 324}
                    ]}
                ]);
            }
    });

    it('Should return stats for st-101 server', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .monitoringStats({
                server: {
                    id: 'va1altdst-101'
                },
                groupBy: Resource.SERVER,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                }
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 1);
            var serverStats = statsData[0];

            assert.equal(serverStats.entity.id, 'va1altdst-101');

            assert.deepEqual(serverStats.statistics, [{
                "timestamp": "2015-07-30T09:36:40Z",
                "cpu": 1,
                "cpuPercent": 0.28,
                "memoryMB": 1024,
                "memoryPercent": 1.49,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 16896,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 512},
                    {"id": "0:1", "capacityMB": 2048},
                    {"id": "0:2", "capacityMB": 14336}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 13983, "consumedMB": 1316},
                    {"path": "/boot", "capacityMB": 494, "consumedMB": 108}
                ]
            }]);
        }
    });

    it('Should return stats for VA1 datacenter', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .monitoringStats({
                dataCenter: DataCenter.US_EAST_STERLING,
                groupBy: Resource.DATACENTER,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                }
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 1);
            var dataCenterStatsData = statsData[0];

            assert.equal(dataCenterStatsData.entity.id, DataCenter.US_EAST_STERLING.id);

            assert.deepEqual(dataCenterStatsData.statistics, [{
                "timestamp": "2015-07-30T11:28:40Z",
                "cpu": 6,
                "cpuPercent": 0.25666666666666665,
                "memoryMB": 6144,
                "memoryPercent": 1.4933333333333334,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 101376,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 3072},
                    {"id": "0:1", "capacityMB": 12288},
                    {"id": "0:2", "capacityMB": 86016}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 83898, "consumedMB": 7896},
                    {"path": "/boot", "capacityMB": 2964, "consumedMB": 648}
                ]
            }]);
        }
    });

    it('Should return stats for Default group with subgroups in VA1 aggregated by group', function (done) {
        this.timeout(timeout);

        compute
            .statistics()
            .monitoringStats({
                group: defaultGroupCriteria,
                groupBy: Resource.GROUP,
                timeFilter: {
                    type: compute.MonitoringStatsType.LATEST
                },
                aggregateSubItems: true
            })
            .then(checkStatsData)
            .then(done);

        function checkStatsData(statsData) {
            assert.equal(statsData.length, 2);
            var groupStatsData = statsData[0];
            var subGroupStatsData = statsData[1];

            assert.equal(groupStatsData.entity.name, Group.DEFAULT);
            assert.equal(groupStatsData.entity.locationId.toLowerCase(), DataCenter.US_EAST_STERLING.id);

            assert.deepEqual(groupStatsData.statistics, [{
                "timestamp": "2015-07-31T09:26:40Z",
                "cpu": 3,
                "cpuPercent": 0.25666666666666665,
                "memoryMB": 3072,
                "memoryPercent": 1.1600000000000001,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 50688,
                "diskUsage": [
                    {"id": "0:0", "capacityMB": 1536},
                    {"id": "0:1", "capacityMB": 6144},
                    {"id": "0:2", "capacityMB": 43008}
                ],
                "guestDiskUsage": [
                    {"path": "/", "capacityMB": 41949, "consumedMB": 3948},
                    {"path": "/boot", "capacityMB": 1482, "consumedMB": 324}
                ]
            }]);

            assert.equal(subGroupStatsData.entity.name, 'Subgroup');
            assert.equal(subGroupStatsData.entity.locationId.toLowerCase(), DataCenter.US_EAST_STERLING.id);

            assert.deepEqual(subGroupStatsData.statistics, [{
                "timestamp": null,
                "cpu": 0,
                "cpuPercent": 0,
                "memoryMB": 0,
                "memoryPercent": 0,
                "networkReceivedKBps": 0,
                "networkTransmittedKBps": 0,
                "diskUsageTotalCapacityMB": 0,
                "diskUsage": [],
                "guestDiskUsage": []
            }]);
        }
    });

    ///* TODO tests can't be running due to start param can be incorrect over time */
    //it('Should return summarized stats for Default group in VA1', function (done) {
    //    this.timeout(timeout);
    //
    //    compute
    //        .statistics()
    //        .monitoringStats({
    //            group: defaultGroupCriteria,
    //            timeFilter: {
    //                start: '2015-07-28T18:00:00',
    //                end: '2015-07-28T20:00:00',
    //                sampleInterval: '02:00:00',
    //                type: compute.MonitoringStatsType.HOURLY
    //            },
    //            summarize: true
    //        })
    //        .then(checkStatsData)
    //        .then(done);
    //
    //    function checkStatsData(statsData) {
    //        assert.equal(statsData.length, 2);
    //
    //        var firstTimeIntervalData = statsData[0];
    //        var secondTimeIntervalData = statsData[1];
    //
    //        assert.deepEqual(firstTimeIntervalData, {
    //            "timestamp": "2015-07-28T18:00:00Z",
    //            "cpu": 3,
    //            "cpuPercent": 0.26333333333333336,
    //            "memoryMB": 3072,
    //            "memoryPercent": 1.5566666666666666,
    //            "networkReceivedKBps": 0,
    //            "networkTransmittedKBps": 0,
    //            "diskUsageTotalCapacityMB": 50688,
    //            "diskUsage": [
    //                {"id": "0:2", "capacityMB": 43008},
    //                {"id": "0:1",  "capacityMB": 6144},
    //                {"id": "0:0", "capacityMB": 1536}
    //            ],
    //            "guestDiskUsage": [
    //                {"path": "/", "capacityMB": 41949, "consumedMB": 3948},
    //                {"path": "/boot", "capacityMB": 1482, "consumedMB": 324}
    //            ]
    //        });
    //
    //        assert.deepEqual(secondTimeIntervalData, {
    //            "timestamp": "2015-07-28T20:00:00Z",
    //            "cpu": 3,
    //            "cpuPercent": 0.26333333333333336,
    //            "memoryMB": 3072,
    //            "memoryPercent": 1.7633333333333334,
    //            "networkReceivedKBps": 0,
    //            "networkTransmittedKBps": 0,
    //            "diskUsageTotalCapacityMB": 50688,
    //            "diskUsage": [
    //                {"id": "0:2", "capacityMB": 43008},
    //                {"id": "0:1", "capacityMB": 6144},
    //                {"id": "0:0", "capacityMB": 1536}
    //            ],
    //            "guestDiskUsage": [
    //                {"path": "/", "capacityMB": 41949, "consumedMB": 3948},
    //                {"path": "/boot","capacityMB": 1482,"consumedMB": 324}
    //            ]
    //        });
    //    }
    //});

});