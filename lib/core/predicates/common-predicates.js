var Predicate = require('./predicate.js');
var _ = require('./../underscore.js');

module.exports = {
    ContainsPredicate: ContainsPredicate,
    EqualPredicate: EqualPredicate,
    ArrayContainsPredicate: ArrayContainsPredicate,
    extractValue: extractValue,
    compareIgnoreCase: compareIgnoreCase,
    ExtractPredicate: ExtractPredicate
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


function EqualPredicate (matchData, property) {
    var self = this;

    function equal (data) {
        return extractValue(data, property) === matchData;
    }

    Predicate.call(self, equal);
}

function extractValue(data, path) {
    if (!path || !data) {
        return data;
    }

    return _.reduce(path.split("."), function(memo, property) {
        return memo && memo[property];
    }, data);
}

function compareIgnoreCase(expected, actual) {
    if (_.isString(expected) && _.isString(actual)) {
        return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
    }
    return false;
}

function ExtractPredicate(predicate, path) {
    var self = this;

    function extract(data) {
        return predicate.fn(extractValue(data, path));
    }

    Predicate.call(self, extract);
}
