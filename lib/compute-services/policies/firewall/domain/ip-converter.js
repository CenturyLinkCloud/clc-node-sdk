var IpSubnetCalculator = require('ip-subnet-calculator');
var _ = require('underscore');

module.exports = IpToCidrConverter;

function IpToCidrConverter(ip, mask) {
    if (mask === undefined) {
        return _.map(_.asArray(ip), function(config) {
            if (config instanceof Object) {
                return convert(config.ip, config.mask);
            }
            return config;
        });
    }
    return convert(ip, mask);
}

function convert(ip, mask) {
    var subnet = IpSubnetCalculator.calculateCIDRPrefix(ip, mask);
    return subnet.ipLowStr + '/' + subnet.prefixSize;
}