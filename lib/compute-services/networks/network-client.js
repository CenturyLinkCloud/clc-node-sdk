
module.exports = NetworkClient;

function NetworkClient(rest) {
    var self = this;

    self.findNetworks = function (dataCenterId) {
        return rest.get('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId);
    };

    self.findNetwork = function (networkId, dataCenterId, ipAddressesDetails) {
        return rest.get('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + '/' + networkId +
            (ipAddressesDetails ? ("?ipAddresses=" + ipAddressesDetails) : ""));
    };
}
