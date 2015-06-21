var assert = require('assert');
var _ = require('underscore');
var Group = require('./../lib/compute-services/groups/domain/group.js');
var DataCenter = require('./../lib/base-services/datacenters/domain/datacenter.js');

var TestAsserts = {
    assertThatDataCenterIsDe1 : function (dataCenter) {
        assert.equal(dataCenter.id, DataCenter.DE_FRANKFURT.id);
        assert.equal(dataCenter.name, DataCenter.DE_FRANKFURT.name);
    },

    assertThatGroupIsDefault : function (group) {
        assert.equal(group.name, Group.DEFAULT);
    },

    assertThatArrayIsEmpty : function(array) {
        assert.equal(array.length, 0);
    },

    assertThatResultNotEmpty : function(result) {
        assert.equal(
            result && !_.isUndefined(result) && !_.isNull(result) && (_.isArray(result) ? result.length > 0 : true),
            true
        );
    }
};

module.exports = TestAsserts;
