
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

    self.claimNetwork = function(dataCenterId){
        return rest.postJson('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/claim");
    };

    self.updateNetwork = function(dataCenterId, networkId, updateRequest){
        return rest.putJson(
            '/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/" + networkId,
            updateRequest
        );
    };

    self.releaseNetwork = function(dataCenterId, networkId){
        return rest.postJson('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/" + networkId + "/release");
    };
}
