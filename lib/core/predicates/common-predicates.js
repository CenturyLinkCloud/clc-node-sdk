
var Predicate = require('./predicate.js');
var _ = require('underscore');

module.exports = {
    ContainsPredicate: ContainsPredicate,
    EqualPredicate: EqualPredicate,
    ArrayContainsPredicate: ArrayContainsPredicate
};


function ContainsPredicate (matchData, property) {
    var self = this;

    function contains (data) {
        if (property) {
            data = data[property];
        }
        if (_.isString(matchData) && _.isString(data)) {
            return data.toUpperCase().indexOf(matchData.toUpperCase()) > -1;
        } else {
            return false;
        }
    }

    Predicate.call(self, contains);
}

function ArrayContainsPredicate (matchData, property) {
    var self = this;

    function contains (data) {
        if (data) {
            return [].concat(matchData).indexOf(data[property]) > -1;
        }
        return false;
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
