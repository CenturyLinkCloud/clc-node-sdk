
var _ = require('./../../../core/underscore.js');
var SingleServerCriteria = require('./single-server-criteria.js');
var CompositeServerCriteria = require('./composite-server-criteria.js');
var Criteria = require('./../../../core/criteria/criteria.js');

module.exports = ServerCriteria;

/**
 * @typedef ServerCriteria
 * @type {object}
 *
 * @property {string} id - a group id restriction.
 * @property {string} name - a group name restriction.
 * @property {string} nameContains - restriction that pass only group which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only group which description contains specified keyword.
 * @property {DataCenterCriteria} dataCenter - restrict datacenters in which need to execute search.
 * @property {GroupCriteria} group - restrict groups in which need to execute search.
 */
function ServerCriteria (criteria) {
    var self = this;

    self.predicate = function () {
        var serverCriteria = new Criteria(criteria).isConditional() ?
            new CompositeServerCriteria(criteria) :
            new SingleServerCriteria(criteria);

        return serverCriteria.predicate();
    };

    self.processGroupCriteria = function() {
        if (new Criteria(criteria).isConditional()) {
            _.each(_.keys(criteria), function(key) {
                criteria[key] = _.map(criteria[key], function(subcriteria) {
                    return new ServerCriteria(subcriteria).processGroupCriteria();
                });
            });
        } else {
            criteria =  new SingleServerCriteria(criteria).processGroupCriteria();
        }
        return criteria;
    };
}