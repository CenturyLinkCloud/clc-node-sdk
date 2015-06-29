

module.exports = ServerClient;

function ServerClient (client) {
    var self = this;

    function init () {
    }

    self.findServerById = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId);
    };

    self.findServerByUuid = function (serverUuid) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverUuid + '?uuid=True');
    };

    self.createServer = function (createServerRequest) {
        return client.postJson('/v2/servers/{ACCOUNT}/', createServerRequest);
    };

    self.cloneServer = function (cloneServerRequest) {
        return client.postJson('/v2/servers/{ACCOUNT}/', cloneServerRequest);
    };

    self.deleteServer = function (serverId) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId);
    };

    self.findServerCredentials = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/credentials');
    };

    init();
}
