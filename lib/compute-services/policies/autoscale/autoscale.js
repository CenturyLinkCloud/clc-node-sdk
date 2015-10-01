var _ = require('underscore');
var Vertical = require('./vertical/vertical');


module.exports = AutoScale;

/**
 * Service that allow to manage autoscale policies (vertical, horizontal) in CenturyLink Cloud
 *
 * @param policyClient
 * @constructor
 */
function AutoScale(policyClient) {
    var self = this;

    self.vertical = _.memoize(function () {
        return new Vertical(
            policyClient
        );
    });

}