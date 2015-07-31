var _ = require('./../../../core/underscore.js');
var Promise = require("bluebird");
var Resource = require('./resource.js');

module.exports = MonitoringStatsEngine;

/**
 * @typedef Statistics
 * @type {object}
 *
 * @property {string} timestamp - timestamp.
 * @property {string} cpu - cpu count.
 * @property {string} cpuPercent - cpu percent.
 * @property {string} memoryMB - memory.
 * @property {string} memoryPercent - memory percent.
 * @property {string} networkReceivedKBps - network received.
 * @property {string} networkTransmittedKBps - network transmitted.
 * @property {string} diskUsageTotalCapacityMB - disk usage total capacity.
 * @property {Object} diskUsage - disk usage.
 * @property {Object} guestDiskUsage - guest disk usage.
 *
 * @example diskUsage
 * [
 *     {
 *         "id": "0:0",
 *         "capacityMB": 40960
 *     }
 * ],
 *
 * @example guestDiskUsage
 * [
 *     {
 *         "path": "C:\\",
 *         "capacityMB": 40607,
 *         "consumedMB": 16619
 *     }
 * ],
 *
 * @example Statistics
 * {
 *    {
 *        "timestamp": "2014-04-09T20:00:00Z",
 *        "cpu": 1.0,
 *        "cpuPercent": 1.14,
 *        "memoryMB": 2048.0,
 *        "memoryPercent": 9.24,
 *        "networkReceivedKBps": 0.0,
 *        "networkTransmittedKBps": 0.0,
 *        "diskUsageTotalCapacityMB": 40960.0,
 *        "diskUsage": [
 *            {
 *              "id": "0:0",
 *              "capacityMB": 40960
 *            }
 *        ],
 *       "guestDiskUsage": [
 *           {
 *               "path": "C:\\",
 *               "capacityMB": 40607,
 *               "consumedMB": 16619
 *           }
 *       ]
 *     }
 * }
 */

/**
 * @typedef MonitoringStatsEntry
 * @type {object}
 *
 * @property {DataCenterMetadata|GroupMetadata|ServerMetadata} entity - entity metadata.
 * @property {Statistics} statistics - aggregated statistics.
 *
 * @example MonitoringStatsEngine
 * {
 *     entity: {
 *         id: 5757349d19c343a88ce9a473fe2522f4,
  *        name: Default Group,
  *        ...
  *    },
 *     statistics: {Statistics}
 * }
 */
function MonitoringStatsEngine(statsParams, serverService, groupService, dataCenterService) {
    var self = this;

    function init() {
        parseSearchCriteria();
        parseTimeFilter();
        parseGroupingParam();
        parseSubItemsAggregationAbility();
        parseSummarizeAbility();
    }

    function parseSearchCriteria() {
        if (statsParams.group) {
            self.groupCriteria = statsParams.group;
        } else if (statsParams.dataCenter) {
            self.dataCenterCritiria = statsParams.dataCenter;
        } else if (statsParams.server) {
            self.serverCriteria = statsParams.server;
        } else {
            throw new Error("Incorrect search criteria");
        }
    }

    function parseTimeFilter() {
        self.timeFilter = statsParams.timeFilter;
    }

    function parseGroupingParam() {
        if (statsParams.groupBy !== Resource.SERVER && statsParams.groupBy !== Resource.DATACENTER) {
            self.groupBy = Resource.GROUP;
        } else {
            self.groupBy = statsParams.groupBy;
        }
    }

    function parseSubItemsAggregationAbility() {
        self.aggregateSubItems = statsParams.aggregateSubItems === true;
    }

    function parseSummarizeAbility() {
        self.summarize = statsParams.summarize === true;
    }

    self.execute = function() {
        var statsData = fetchStatsData()
            .then(includeSubItemsIfNecessary)
            .then(collectAllTimeIntervals);

        if (self.summarize) {
            return statsData.then(summarizeStatistics);
        }

        switch(self.groupBy) {
            case Resource.GROUP:
                return statsData.then(groupByGroup);
            case Resource.DATACENTER:
                return statsData.then(groupByDataCenter);
            case Resource.SERVER:
                return statsData.then(groupByServer);
        }
    };

    function summarizeStatistics(statsDataList) {
        var result = [];
        var serverStatsDataList = getServerStatsDataList(statsDataList);

        _.each(self.timeIntervals, function(interval) {
            var statistics = createStatisticsObject();

            _.each(serverStatsDataList, function(serverStatsData) {
                if (serverStatsData.timestamp === interval) {
                    aggregateStatistics(statistics, serverStatsData);
                }
            });

            result.push(collectStats(statistics));
        });

        return result;
    }

    function groupByGroup(statsDataList) {
        return Promise.all(
            _.map(statsDataList, function(groupStatsData) {
                var groupStatsByIntervals = summarizeStatistics(groupStatsData);

                return Promise.props({
                    entity: groupStatsData.group,
                    statistics: groupStatsByIntervals
                });
            })
        );
    }

    function groupByServer(statsDataList) {
        return Promise.all(
            _.map(getServerDataList(statsDataList), function(serverData) {
                return Promise.props({
                    entity: serverService.findSingle({
                        id: serverData.name.toLowerCase()
                    }),
                    statistics: serverData.stats
                });
            })
        );
    }

    function groupByDataCenter(statsDataList) {
        var dataCenterMap = {};

        _.each(statsDataList, function(groupStatsData) {
            var dataCenterId = groupStatsData.group.locationId.toLowerCase();
            var serverStatsDataList = getServerStatsDataList(groupStatsData);

            dataCenterMap[dataCenterId] = dataCenterMap.hasOwnProperty(dataCenterId) ?
                dataCenterMap[dataCenterId].concat(serverStatsDataList) :
                serverStatsDataList;
        });

        var result = [];

        _.each(dataCenterMap, function(dataCenterStats, dataCenterId) {
            var aggregatedStatsByIntervals = [];

            _.each(self.timeIntervals, function(interval) {
                var statistics = createStatisticsObject();

                _.each(dataCenterStats, function(stats) {
                    if (stats.timestamp === interval) {
                        aggregateStatistics(statistics, stats);
                    }
                });

                aggregatedStatsByIntervals.push(collectStats(statistics));
            });

            result.push(Promise.props({
                entity: dataCenterService.findSingle({id: dataCenterId}),
                statistics: aggregatedStatsByIntervals
            }));
        });

        return Promise.all(result);
    }

    function collectAllTimeIntervals(statsData) {
        self.timeIntervals = fetchServersStream(statsData)
            .pluck('stats').flatten()
            .pluck('timestamp')
            .unique()
            .value();

        return statsData;
    }

    function getServerStatsDataList(statsData) {
        return fetchServersStream(statsData)
            .pluck('stats').flatten()
            .value();
    }

    function getServerDataList(statsData) {
        return fetchServersStream(statsData).value();
    }

    function fetchServersStream(statsData) {
        var allServers = statsData instanceof Array ?
            _.chain(statsData).pluck('servers').flatten() :
            _.chain(statsData.servers);

        return allServers.filter(checkServer);
    }

    function createStatisticsObject() {
        return {
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
        };
    }

    function aggregateStatistics(statistics, statsToBeAdded) {
        statistics.counter = statistics.counter !== undefined ? ++statistics.counter : 1;

        if (statistics.timestamp === null) {
            statistics.timestamp = statsToBeAdded.timestamp;
        }

        statistics.cpu += statsToBeAdded.cpu;
        statistics.memoryMB += statsToBeAdded.memoryMB;
        statistics.cpuPercent += statsToBeAdded.cpuPercent;
        statistics.memoryPercent += statsToBeAdded.memoryPercent;

        statistics.networkReceivedKBps += statsToBeAdded.networkReceivedKBps;
        statistics.networkTransmittedKBps += statsToBeAdded.networkTransmittedKBps;
        statistics.diskUsageTotalCapacityMB += statsToBeAdded.diskUsageTotalCapacityMB;

        statistics.diskUsage = statistics.diskUsage.concat(statsToBeAdded.diskUsage);
        statistics.guestDiskUsage = statistics.guestDiskUsage.concat(statsToBeAdded.guestDiskUsage);
    }

    function collectStats(statistics) {
        if (statistics.counter !== undefined) {
            statistics.cpuPercent /= statistics.counter;
            statistics.memoryPercent /= statistics.counter;

            statistics.diskUsage = collectDiskUsageStats(statistics.diskUsage);
            statistics.guestDiskUsage = collectGuestDiskUsageStats(statistics.guestDiskUsage);

            delete statistics.counter;
        }

        return statistics;
    }

    function collectDiskUsageStats(diskUsageStats) {
        var diskUsageMap = {};

        _.each(diskUsageStats, function(disk) {
            if (diskUsageMap[disk.id] === undefined) {
                diskUsageMap[disk.id] = disk;
            } else {
                diskUsageMap[disk.id]['capacityMB'] += disk.capacityMB;
            }
        });

        return _.values(diskUsageMap);
    }

    function collectGuestDiskUsageStats(guestDiskUsageStats) {
        var diskUsageMap = {};

        _.each(guestDiskUsageStats, function(disk) {
            if (diskUsageMap[disk.path] === undefined) {
                diskUsageMap[disk.path] = disk;
            } else {
                diskUsageMap[disk.path]['capacityMB'] += disk.capacityMB;
                diskUsageMap[disk.path]['consumedMB'] += disk.consumedMB;
            }
        });

        return _.values(diskUsageMap);
    }

    function checkServer(server) {
        return self.serverIdList === undefined ||
            _.contains(self.serverIdList, server.name.toLowerCase());
    }

    function fetchStatsData() {
        if (self.groupCriteria !== undefined) {
            return groupService.getMonitoringStats(self.groupCriteria, self.timeFilter);
        }

        if (self.dataCenterCritiria !== undefined) {
            return groupService.getMonitoringStats(
                { dataCenter: self.dataCenterCritiria },
                self.timeFilter
            );
        }

        return serverService
            .find(self.serverCriteria)
            .then(collectServerIdList)
            .then(fetchGroupIdList)
            .then(function(groupIdList) {
                return groupService.getMonitoringStats(
                    { id: groupIdList },
                    self.timeFilter
                );
            });
    }

    function includeSubItemsIfNecessary(statsDataList) {
        return statsDataList;
    }

    function collectServerIdList(servers) {
        self.serverIdList = pluckPropertiesFromList('id', servers);

        return servers;
    }

    function fetchGroupIdList(servers) {
        return pluckPropertiesFromList('groupId', servers);
    }

    function pluckPropertiesFromList(property, list) {
        return _.chain(list)
            .pluck(property)
            .unique()
            .value();
    }

    init();
}