var assert = require('assert');
var _ = require('underscore');
var Sdk = require('./../lib/clc-sdk.js');

var sdk = new Sdk();
var compute = sdk.computeServices();
var DataCenter = compute.DataCenter;
var OsFamily = compute.OsFamily;
var Machine = compute.Machine;

function listTemplates() {
    sdk
        .computeServices()
        .templates()
        .find({
            dataCenter: DataCenter.DE_FRANKFURT,
            operatingSystem: {
                family: OsFamily.CENTOS,
                architecture: Machine.Architecture.X86_64
            }
        })
        .then(function (results) {
            var firstItem = results[0];

            assert(results.length > 0);
            assert(/^CENTOS/.test(firstItem.name));

            console.log(results);
        });
}

listTemplates();