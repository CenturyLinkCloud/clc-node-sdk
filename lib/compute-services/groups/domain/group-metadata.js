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
            .flatten()
            .uniq(filterFn)
            .value();
    };

    self.getParentGroupId = function() {
        var group = this;
        var parentGroupLink = _.findWhere(group.links, {rel: 'parentGroup'});
        return parentGroupLink ? parentGroupLink.id : null;
    };

    self.getGroups = function() {
        var group = this;

        return _.applyMixin(GroupMetadata, group.groups);
    };

    function filterFn (metadata) {
        return metadata.id;
    }
}