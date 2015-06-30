

module.exports = GroupClient;

function GroupClient(rest) {
    var self = this;

    self.createGroup = function (createGroupRequest) {
        return rest.postJson('/v2/groups/{ACCOUNT}/', createGroupRequest);
    };

    self.deleteGroup = function (groupId) {
        return rest.delete('/v2/groups/{ACCOUNT}/' + groupId);
    };

    self.findGroupById = function (groupId, includeServerDetails) {
        return rest.get('/v2/groups/{ACCOUNT}/' + groupId + (includeServerDetails ? "?serverDetail=detailed" : ""));
    };

    self.changeGroupName = function (groupId, name) {
        return rest.patchJson('/v2/groups/{ACCOUNT}/' + groupId, [{
            "op": "set",
            "member": "name",
            "value": name
        }]);
    };
}
