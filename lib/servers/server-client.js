

module.exports = ServerClient;

function ServerClient (client) {
    var self = this;

    function init () {
    }

    self.findServerById = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId);
    };

    self.findGroupById = function (groupId) {
        return client.get('/v2/groups/{ACCOUNT}/' + groupId);
    };

    init();
}

module.exports = ServerClient;
