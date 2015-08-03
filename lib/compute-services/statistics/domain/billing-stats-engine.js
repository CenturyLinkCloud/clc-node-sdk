var _ = require('./../../../core/underscore.js');
var Promise = require("bluebird");
var Resource = require('./resource.js');

module.exports = BillingStatsEngine;

/**
 * @typedef Statistics
 * @type {object}
 *
 * @property {string} archiveCost - archive cost.
 * @property {string} templateCost - template cost.
 * @property {string} monthlyEstimate - monthly estimate.
 * @property {string} monthToDate - month to date estimate.
 * @property {string} currentHour - current hour cost.
 *
 * @example Statistics
 * {
 *     templateCost: 0,
 *     archiveCost: 0,
 *     monthlyEstimate: 77.76,
 *     monthToDate": 17.93,
 *     currentHour: 0.108
 * }
 */

/**
 * @typedef BillingStatsEntry
 * @type {object}
 *
 * @property {DataCenterMetadata|GroupMetadata|ServerMetadata} entity - entity metadata.
 * @property {Statistics} statistics - aggregated statistics.
 *
 * @example BillingStatsEntry
 * {
 *     entity: {
 *         id: 5757349d19c343a88ce9a473fe2522f4,
  *        name: Default Group,
  *        ...
  *    },
 *     statistics: {
 *         templateCost: 0,
 *         archiveCost: 0,
 *         monthlyEstimate: 77.76,
 *         monthToDate: 17.93,
 *         currentHour: 0.108
 *     }
 * }
 */
function BillingStatsEngine(statsParams, serverService, groupService, dataCenterService) {
    var self = this;

    function init() {
        parseSearchCriteria();
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
        var statsData = fetchStatsData().then(includeSubItemsIfNecessary);

        if (self.summarize) {
            return statsData.then(summarizeStatistics);
        }

        switch(self.groupBy) {
            case Resource.GROUP:
                return statsData.then(groupByGroup);
            case Resource.DATACENTER:
                return statsData
                    .then(attachDataCenterId)
                    .then(groupByDataCenter)
                    .then(loadDataCenterMetadata);
            case Resource.SERVER:
                return statsData.then(groupByServer);
        }
    };

    function summarizeStatistics(data) {
        var statistics = createStatisticsObject();

        _.each(data, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                aggregateGroupStats(statistics, groupBilling);
            });
        });

        return statistics;
    }

    function groupByGroup(statsDataList) {
        var result = [];

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                var statistics = createStatisticsObject();
                aggregateGroupStats(statistics, groupBilling);

                result.push(Promise.props({
                    entity: groupService.findSingle({ id: groupBilling.groupId }),
                    statistics: statistics
                }));
            });
        });

        return Promise.all(result);
    }

    function attachDataCenterId(statsDataList) {
        var result = _.map(statsDataList, function(statsData) {
            var groups = _.map(statsData.groups, function(groupBilling) {
                return groupService
                    .findSingle({
                        id: groupBilling.groupId
                    })
                    .then(function(groupMetadata) {
                        return _.extend(groupBilling, {
                            dataCenterId: groupMetadata.locationId.toLowerCase()
                        });
                    });
            });

            return Promise.props({
                date: statsData.date,
                groups: Promise.all(groups)
            });
        });

        return Promise.all(result);
    }

    function loadDataCenterMetadata(dataCenterMap) {
        var result = [];

        for (var dataCenterId in dataCenterMap) {
            if (!dataCenterMap.hasOwnProperty(dataCenterId)) {
                continue;
            }

            result.push(Promise.props({
                entity: dataCenterService.findSingle({ id: dataCenterId }),
                statistics: dataCenterMap[dataCenterId]
            }));
        }

        return Promise.all(result);
    }

    function groupByDataCenter(statsDataList) {
        var dataCenterMap = {};

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                var dataCenterId = groupBilling.dataCenterId;

                if (dataCenterMap.hasOwnProperty(dataCenterId)) {
                    aggregateGroupStats(dataCenterMap[dataCenterId], groupBilling);
                } else {
                    var statistics = createStatisticsObject();
                    aggregateGroupStats(statistics, groupBilling);
                    dataCenterMap[dataCenterId] = statistics;
                }
            });
        });

        return dataCenterMap;
    }

    function groupByServer(statsDataList) {
        var result = [];

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                _.each(groupBilling.servers, function(serverBilling) {
                    if (checkServerId(serverBilling.serverId)) {
                        var statistics = createStatisticsObject();
                        aggregateServerStats(statistics, serverBilling);

                        result.push(Promise.props({
                            entity: serverService.findSingle({ id: serverBilling.serverId }),
                            statistics: statistics
                        }));
                    }
                });
            });
        });

        return Promise.all(result);
    }

    function createStatisticsObject() {
        return {
            archiveCost: 0,
            templateCost: 0,
            monthlyEstimate: 0,
            monthToDate: 0,
            currentHour: 0
        };
    }

    function aggregateGroupStats(statistics, groupBilling) {
        _.each(groupBilling.servers, function(serverBilling) {
            if (checkServerId(serverBilling.serverId)) {
                aggregateServerStats(statistics, serverBilling);
            }
        });
    }

    function aggregateServerStats(statistics, serverBilling) {
        statistics.archiveCost = statistics.archiveCost + serverBilling.archiveCost;
        statistics.templateCost = statistics.templateCost + serverBilling.templateCost;
        statistics.monthlyEstimate = statistics.monthlyEstimate + serverBilling.monthlyEstimate;
        statistics.monthToDate = statistics.monthToDate + serverBilling.monthToDate;
        statistics.currentHour = statistics.currentHour + serverBilling.currentHour;
    }

    function checkServerId(serverId) {
        return self.serverIdList === undefined ||
            _.contains(self.serverIdList, serverId);
    }

    function fetchStatsData() {
        if (self.groupCriteria !== undefined) {
            return groupService.getBillingStats(self.groupCriteria);
        }

        if (self.dataCenterCritiria !== undefined) {
            return groupService.getBillingStats({
                dataCenter: self.dataCenterCritiria
            });
        }

        return serverService
            .find(self.serverCriteria)
            .then(collectServerIdList)
            .then(fetchGroupIdList)
            .then(function(groupIdList) {
                return groupService.getBillingStats({
                    id: groupIdList
                });
            });
    }

    function includeSubItemsIfNecessary(statsDataList) {
        if (!self.aggregateSubItems) {
            _.each(statsDataList, function(statsData) {
                statsData.groups = [_.first(statsData.groups)];
            });
        }

        return statsDataList;
    }

    function collectServerIdList(servers) {
        self.serverIdList = _.chain(servers)
            .pluck('id')
            .unique()
            .value();

        return servers;
    }

    function fetchGroupIdList(servers) {
        return _.chain(servers)
            .pluck('groupId')
            .unique()
            .value();
    }

    init();
}