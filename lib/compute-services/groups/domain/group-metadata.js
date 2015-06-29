var _ = require("underscore");

module.exports = GroupMetadata;

function GroupMetadata() {
    var self = this;

    self.getAllGroups = function() {
        var group = this;

        _.each(group.groups, function(subgroup) {
            subgroup.dataCenter = group.dataCenter;
        });

        return _.chain(_.asArray(
                group,
                _.map(group.groups, function(subgroup) {
                    return _.applyMixin(GroupMetadata, subgroup).getAllGroups();
                })
            ))
            .filter(filterFn)
            .uniq(filterFn)
            .value();
    };

    self.getAllServers = function() {
        var group = this;

        var groups = group.getAllGroups();

        var allServers = _.map(groups, function(group) {
            return _.map(group.servers, function(server) {
                server.group = group;
                return server;
            });
        });

        return _.chain(allServers)
            .uniq(filterFn)
            .value();
    };

    function filterFn (metadata) {
        return metadata.id;
    }
}