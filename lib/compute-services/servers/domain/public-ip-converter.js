
var _ = require('underscore');
var IpSubnetCalculator = require('ip-subnet-calculator');
var Protocol = require('./protocol.js');

module.exports = PublicIpConverter;

function PublicIpConverter() {

    var self = this;

    self.convert = function(publicIpConfig) {
        var ports = _.map(publicIpConfig.openPorts, fetchPort);
        var sourceRestrictions = _.map(publicIpConfig.sourceRestrictions, fetchRestriction);

        var result = {
            ports: ports,
            sourceRestrictions: sourceRestrictions
        };

        if (publicIpConfig.internalIPAddress) {
            result.internalIPAddress = publicIpConfig.internalIPAddress;
        }

        return result;
    };

    function fetchPort(data) {
        var result = {
            protocol: data.protocol ? data.protocol : Protocol.TCP,
            port: data instanceof Object ? ( data.port ? data.port : data.from ) : data
        };

        if (data.to) {
            result.portTo = data.to;
        }

        return result;
    }

    function fetchRestriction(data) {
        var cidr = data;

        if (data instanceof Object) {
            var subnet = IpSubnetCalculator.calculateCIDRPrefix(data.ip, data.mask);
            cidr = subnet.ipLowStr + '/' + subnet.prefixSize;
        }

        return { cidr: cidr };
    }
}