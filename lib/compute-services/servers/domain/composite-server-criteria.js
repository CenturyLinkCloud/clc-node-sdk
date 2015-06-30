
var _ = require('./../../../core/underscore.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = CompositeServerCriteria;


function CompositeServerCriteria(criteria) {
    var ServerCriteria = require('./server-criteria.js');
    var self = this;

    self.predicate = function () {
        return new Criteria(criteria).compositePredicate(ServerCriteria);
    };
}