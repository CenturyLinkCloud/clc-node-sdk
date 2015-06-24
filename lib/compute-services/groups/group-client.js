

module.exports = GroupClient;

function GroupClient(rest) {
    var self = this;

    self.create = function (createGroupRequest) {
        return rest.postJson('/v2/groups/{ACCOUNT}/', createGroupRequest);
    };
}