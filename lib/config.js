
var fs = require('fs');
var properties = fs.readFileSync('./package.json', 'utf8');

module.exports = Config;

function Config() {
    var self = this;

    self.fetchUserAgent = function() {
        var properties = getProperties();
        return properties.name + "-v" + properties.version;
    };

    function getProperties() {
        return JSON.parse(properties);
    }
}