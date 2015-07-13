var _ = require('underscore');

module.exports = DataCenterMetadata;

function DataCenterMetadata() {
    var self = this;

    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}