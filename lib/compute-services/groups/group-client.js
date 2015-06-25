

module.exports = GroupClient;

function GroupClient(rest) {
    var self = this;

    self.createGroup = function (createGroupRequest) {
        return rest.postJson('/v2/groups/{ACCOUNT}/', createGroupRequest);
    };

    self.deleteGroup = function (groupId) {
        return rest.delete('/v2/groups/{ACCOUNT}/' + groupId);
    };

    self.get = function (groupId, includeServerDetails) {
        return rest.get('/v2/groups/{ACCOUNT}/' + groupId + (includeServerDetails ? "?serverDetail=detailed" : ""));
    };
}
