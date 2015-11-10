
var fs = require('fs');

module.exports = Config;

function Config() {
    var self = this;

    self.fetchUserAgent = function() {
        var properties = self.getProperties();
        return properties.name + "-v" + properties.version;
    };

    self.getProperties = function() {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    }
}