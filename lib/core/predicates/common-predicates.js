var Predicate = require('./predicate.js');
var _ = require('./../underscore.js');

module.exports = {
    ContainsPredicate: ContainsPredicate,
    EqualPredicate: EqualPredicate,
    ArrayContainsPredicate: ArrayContainsPredicate,
    extractValue: extractValue,
    compareIgnoreCase: compareIgnoreCase
};


function ContainsPredicate (matchData, property) {
    var self = this;

    function contains (data) {
        if (property) {
            data = extractValue(data, property);
        }
        if (_.isString(matchData) && _.isString(data)) {
            return compareIgnoreCase(matchData, data);
        } else if (_.isArray(matchData) && _.isString(data)) {
            return _.filter(matchData,
                    function(value) {
                        return compareIgnoreCase(value, data);
                    }
                ).length > 0;
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
            return _.asArray(matchData).indexOf(extractValue(data, property)) > -1;
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

function extractValue(data, path) {
    if (!path) {
        return data;
    }

    return _.reduce(path.split("."), function(memo, property) {
        return memo[property];
    }, data);
}

function compareIgnoreCase(expected, actual) {
    if (_.isString(expected) && _.isString(actual)) {
        return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
    }
    return false;
}
