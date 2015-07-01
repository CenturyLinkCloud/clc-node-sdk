

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

    self.findAvailableServerImports = function (dataCenterId) {
        return client.get('/v2/vmImport/{ACCOUNT}/' + dataCenterId + '/available');
    };

    self.findServerCredentials = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId + '/credentials');
    };

    self.importServer = function (importServerRequest) {
        return client.postJson('/v2/vmImport/{ACCOUNT}/', importServerRequest);
    };

    self.modifyServer = function(serverId, modifyServerRequest) {
        return client.patchJson(
            '/v2/servers/{ACCOUNT}/' + serverId,
            modifyServerRequest
            //JSON.stringify(modifyServerRequest),
            //{headers: {'Content-Type': 'application/json'}}
        );
    };

    init();
}
