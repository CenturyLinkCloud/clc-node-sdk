
var Predicate = require('./predicate.js');
var _ = require('underscore');

module.exports = {
    ContainsPredicate: ContainsPredicate,
    EqualPredicate: EqualPredicate
};


function ContainsPredicate (matchData) {
    var self = this;

    function contains (data) {
        if (_.isString(matchData) && _.isString(data)) {
            return data.toUpperCase().indexOf(matchData.toUpperCase()) > -1;
        } else {
            return false;
        }
    }

    Predicate.call(self, contains);
}


function EqualPredicate (matchData) {
    var self = this;

    function equal (data) {
        return data === matchData;
    }

    Predicate.call(self, equal);
}
