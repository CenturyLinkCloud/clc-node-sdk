var assert = require('assert');
var _ = require('underscore');
var moment = require('moment');
var Promise = require("bluebird");
var Sdk = require('./../lib/clc-sdk.js');
var SampleUtils = require('./sample-utils.js');

var sdk = new Sdk();
var compute = sdk.computeServices();

var DataCenter = compute.DataCenter;
var Server = compute.Server;
var Group = compute.Group;

var server1Name = "st-1";
var server2Name = "st-2";
var server3Name = "st-3";

/* Total billing statistics */
function __getTotalBillingStatistics() {
    return compute
        .statistics()
        .billingStats({
            dataCenter: {},
            groupBy: compute.Resource.GROUP,
            summarize: true
        })
        .then(_.partial(__print, 'Total billing statistics:'));
}

/* Billing statistics grouped by datacenters */
function __getBillingStatisticsGroupedByDataCenters() {
    return compute
        .statistics()
        .billingStats({
            dataCenter: {},
            groupBy: compute.Resource.DATACENTER
        })
        .then(_.partial(__print, 'Billing statistics grouped by datacenters:'));
}

/* Billing statistics grouped by servers within CA1 Datacenter */
function __getCa1BillingStatisticsGroupedByServers() {
    return compute
        .statistics()
        .billingStats({
            dataCenter: DataCenter.CA_VANCOUVER,
            groupBy: compute.Resource.SERVER
        })
        .then(_.partial(__print, 'Billing statistics grouped by servers within CA1 Datacenter:'));
}

/* Monitoring statistics grouped by datacenters */
function __getMonitoringStatisticsGroupedByDataCenters() {
    return compute
        .statistics()
        .monitoringStats({
            dataCenter: {},
            groupBy: compute.Resource.DATACENTER,
            timeFilter: {
                start: moment().subtract(5, 'hours'),
                end: moment().subtract(3, 'hours'),
                sampleInterval: moment.duration(2, 'hours'),
                type: compute.MonitoringStatsType.HOURLY
            }
        })
        .then(_.partial(__print, 'Monitoring statistics grouped by datacenters:'));
}

/* Monitoring statistics grouped by group */
function __getMonitoringStatisticsGroupedByGroup() {
    return compute
        .statistics()
        .monitoringStats({
            dataCenter: DataCenter.CA_VANCOUVER,
            groupBy: compute.Resource.GROUP,
            timeFilter: {
                start: moment().subtract(5, 'hours'),
                end: moment().subtract(3, 'hours'),
                sampleInterval: moment.duration(2, 'hours'),
                type: compute.MonitoringStatsType.HOURLY
            }
        })
        .then(_.partial(__print, 'Monitoring statistics grouped by group:'));
}

/* Latest monitoring statistics by datacenter */
function __getLatestMonitoringStatisticsByDataCenter() {
    return compute
        .statistics()
        .monitoringStats({
            dataCenter: DataCenter.CA_VANCOUVER,
            groupBy: compute.Resource.DATACENTER,
            timeFilter: {
                type: compute.MonitoringStatsType.LATEST
            }
        })
        .then(_.partial(__print, 'Latest monitoring statistics by datacenter:'));
}

function __print(message, data) {
    console.log(message);

    if (data !== undefined) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function run() {
    __print("Running statistics functionality ...\n");

    compute.servers()
        .find({
            dataCenter: DataCenter.CA_VANCOUVER,
            group: Group.DEFAULT
        })
        .then(function(serverMetadataList) {
            if (serverMetadataList.length !== 0) {
                return serverMetadataList;
            }

            return Promise.join(
                SampleUtils.createServer(compute, server1Name, DataCenter.CA_VANCOUVER),
                SampleUtils.createServer(compute, server2Name, DataCenter.CA_VANCOUVER),
                SampleUtils.createServer(compute, server3Name, DataCenter.CA_VANCOUVER)
            );
        })
        .then(__getTotalBillingStatistics)
        .then(__getBillingStatisticsGroupedByDataCenters)
        .then(__getCa1BillingStatisticsGroupedByServers)
        .then(__getMonitoringStatisticsGroupedByDataCenters)
        .then(__getMonitoringStatisticsGroupedByGroup)
        .then(__getLatestMonitoringStatisticsByDataCenter)
        .then(function() {
            __print("\nFinished statistics functionality");
        });
}

run();