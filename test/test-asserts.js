
var assert = require('assert');

module.exports = TestAsserts;

function TestAsserts () {
    var self = this;

    self.assertThatDataCenterIsDe1 = function (dataCenterList) {
        assert.equal(dataCenterList.length, 1);
        assert.equal(dataCenterList[0].id, "de1");
        assert.equal(dataCenterList[0].name, "DE1 - Germany (Frankfurt)");
    };
}