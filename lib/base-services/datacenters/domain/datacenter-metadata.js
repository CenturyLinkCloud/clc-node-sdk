var _ = require('underscore');

module.exports = DataCenterMetadata;

/**
 * The class that represents the data center metadata
 * @property {string} id - Short value representing the data center code.
 * @property {string} name - Full, friendly name of the data center.
 * @property {Array} links - Collection of entity links that point to resources related to this data center.
 * @constructor
 */
function DataCenterMetadata() {
    var self = this;

    /**
     * Get the root group ID (data center id + ' Hardware')
     * @returns {string} the root group ID
     * @memberof DataCenterMetadata
     * @instance
     * @function getGroupId
     */
    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}