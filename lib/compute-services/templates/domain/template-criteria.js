
var _ = require('./../../../core/underscore.js');
var SingleCriteria = require('./single-template-criteria.js');
var CompositeCriteria = require('./composite-template-criteria.js');

var Criteria = require('./../../../core/search/criteria.js');

module.exports = TemplateCriteria;

/**
 * @typedef TemplateCriteria
 * @type {object}
 *
 * @property {string} name - a template name restriction.
 * @property {string} nameContains - restriction that pass only template which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only template which description contains specified keyword.
 * @property {object} operatingSystem
 * @property {string} operatingSystem.family - search templates with operation system of specified os family.
 * @property {string} operatingSystem.version - search templates of specified os version.
 * @property {string} operatingSystem.edition - search templates of specified os edition.
 * @property {Architecture} operatingSystem.architecture - search templates of specified architecture.
 * @property {DataCenterCriteria} dataCenter - restrict datacenters in which need to execute search.
 * @property {string} dataCenterId - restrict templates by DataCenter ID.
 * @property {string} dataCenterName - restrict templates by DataCenter Name.
 * @property {string} dataCenterNameContains - search templates with name that contains specified keyword.
 */
function TemplateCriteria (criteria) {
    var self = this;

    self.predicate = function () {
        var templateCriteria = new Criteria(criteria).isComposite() ?
            new CompositeCriteria(criteria) :
            new SingleCriteria(criteria);

        return templateCriteria.predicate();
    };

    self.parseDataCenterCriteria = function() {
        if (new Criteria(criteria).isComposite()) {
            _.chain(_.keys(criteria))
                .each(function(key) {
                    criteria[key] = _.map(criteria[key], function(subcriteria) {
                        return new TemplateCriteria(subcriteria).parseDataCenterCriteria();
                    });
                }).value();
        } else {
            criteria = new SingleCriteria(criteria).parseDataCenterCriteria();
        }
        return criteria;
    };
}