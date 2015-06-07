
var assert = require('assert');

module.exports = TestAsserts;

function TestAsserts () {
    var self = this;

    self.assertThatDataCenterIsDe1 = function (dataCenter) {
        assert.equal(dataCenter.id, "de1");
        assert.equal(dataCenter.name, "DE1 - Germany (Frankfurt)");
    };

    self.assertThatGroupIsDefault = function (group) {
        assert.equal(group.name, "Default Group");
    };

    self.assertThatArrayIsEmpty = function(array) {
        assert.equal(array.length, 0);
    };
}