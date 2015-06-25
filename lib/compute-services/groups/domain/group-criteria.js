
var _ = require('./../../../core/underscore.js');
var SingleGroupCriteria = require('./single-group-criteria.js');
var CompositeGroupCriteria = require('./composite-group-criteria.js');
var Criteria = require('./../../../core/criteria/criteria.js');

module.exports = GroupCriteria;

/**
 * @typedef GroupCriteria
 * @type {object}
 *
 * @property {string} id - a group id restriction.
 * @property {string} name - a group name restriction.
 * @property {string} nameContains - restriction that pass only group which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only group which description contains specified keyword.
 * @property {DataCenterSearchCriteria} dataCenter - restrict datacenters in which need to execute search.
 */
function GroupCriteria (criteria) {
    var self = this;

    self.predicate = function () {
        var groupCriteria = Criteria.isConditionalCriteria(criteria) ?
            new CompositeGroupCriteria(criteria) :
            new SingleGroupCriteria(criteria);

        return groupCriteria.predicate();
    };
}

GroupCriteria.processDataCenterCriteria = function (criteria) {
    //instantiate object from properties
    var dataCenterCriteria =
    {
        id: criteria.dataCenterId ? _.asArray(criteria.dataCenterId) : null,
        name: criteria.dataCenterName ? _.asArray(criteria.dataCenterName) : null,
        nameContains: criteria.dataCenterNameContains ? _.asArray(criteria.nameContains) : null
    };

    //transform criteria to Array
    var arrayCriteria = !criteria.dataCenter ? _.asArray(dataCenterCriteria)
        : _.asArray(criteria.dataCenter, dataCenterCriteria);

    criteria.dataCenter = {or: _.filter(arrayCriteria, function(criteria) {
        return !_.values(criteria).every(_.isNull);
    })};

    return criteria;
};