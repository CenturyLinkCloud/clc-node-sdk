
var _ = require('./../../../core/underscore.js');
var SingleServerCriteria = require('./single-server-criteria.js');
var CompositeServerCriteria = require('./composite-server-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = ServerCriteria;

/**
 * Class that used to filter servers
 * @typedef ServerCriteria
 * @type {(SingleServerCriteria|CompositeServerCriteria)}
 *
 */
function ServerCriteria (criteria) {
    var self = this;

    self.predicate = function () {
        var serverCriteria = new Criteria(criteria).isComposite() ?
            new CompositeServerCriteria(criteria) :
            new SingleServerCriteria(criteria);

        return serverCriteria.predicate();
    };

    self.parseGroupCriteria = function() {
        if (new Criteria(criteria).isComposite()) {
            _.chain(_.keys(criteria))
                .each(function(key) {
                    criteria[key] = _.map(criteria[key], function(subcriteria) {
                        return new ServerCriteria(subcriteria).parseGroupCriteria();
                    });
                })
                .value();
        } else {
            criteria =  new SingleServerCriteria(criteria).parseGroupCriteria();
        }
        return criteria;
    };
}