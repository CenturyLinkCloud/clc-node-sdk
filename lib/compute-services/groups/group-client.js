
var _ = require('underscore');


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

    self.modifyGroup = function (groupId, changesConfig) {
        var request = _.map(_.keys(changesConfig), function (curKey) {
            return {
                op: 'set',
                member: curKey,
                value: changesConfig[curKey]
            };
        });

        return rest.patchJson('/v2/groups/{ACCOUNT}/' + groupId, request);
    };
}
