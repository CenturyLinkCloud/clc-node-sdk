var assert = require('assert');
var _ = require('underscore');
var Sdk = require('./../lib/clc-sdk.js');

var sdk = new Sdk();
var compute = sdk.computeServices();
var DataCenter = compute.DataCenter;
var OsFamily = compute.OsFamily;
var Machine = compute.Machine;

function listCentOsTemplates() {
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
            assert(results.length > 0);

            assert(/^CENTOS/.test(_.first(results).name));

            console.log('Available CentOs templates is', _.pluck(results, 'name'));
        });
}

listCentOsTemplates();