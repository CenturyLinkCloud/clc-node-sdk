
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

    self.getGroupBillingStats = function (groupId) {
        return rest.get('/v2/groups/{ACCOUNT}/' + groupId + '/billing');
    };

    self.getGroupMonitoringStats = function (groupId, request) {
        var url = composeGetRequestUrl(
            '/v2/groups/{ACCOUNT}/' + groupId + '/statistics',
            request
        );

        return rest.get(url);
    };

    function composeGetRequestUrl(url, params) {
        var isFirstParam = true;

        for (var property in params) {
            if (!params.hasOwnProperty(property)) {
                continue;
            }

            url += isFirstParam ? '?' : '&';
            url += property + '=' + params[property];

            isFirstParam = false;
        }

        return url;
    }
}
