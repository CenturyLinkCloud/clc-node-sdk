var properties = require('../package.json');

module.exports = Config;

function Config() {
    var self = this;

    self.fetchUserAgent = function() {
        var properties = getProperties();
        return properties.name + "-v" + properties.version;
    };

    function getProperties() {
        return properties;
    }
}