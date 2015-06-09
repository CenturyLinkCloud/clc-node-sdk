
var assert = require('assert');
var Group = require('./../lib/compute-services/domain/group.js');
var DataCenter = require('./../lib/compute-services/domain/datacenter.js');

module.exports = TestAsserts;

function TestAsserts () {
    var self = this;

    self.assertThatDataCenterIsDe1 = function (dataCenter) {
        assert.equal(dataCenter.id, DataCenter.DE_FRANKFURT.id);
        assert.equal(dataCenter.name, DataCenter.DE_FRANKFURT.name);
    };

    self.assertThatGroupIsDefault = function (group) {
        assert.equal(group.name, Group.DEFAULT);
    };

    self.assertThatArrayIsEmpty = function(array) {
        assert.equal(array.length, 0);
    };
}