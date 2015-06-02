
var assert = require('assert');

module.exports = TestAsserts;

function TestAsserts () {
    var self = this;

    self.assertThatDataCenterIsDe1 = function (dataCenter) {
        assert.equal(dataCenter.id, "de1");
        assert.equal(dataCenter.name, "DE1 - Germany (Frankfurt)");
    };
}