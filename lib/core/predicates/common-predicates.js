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
            data = extractValue(data, property);
        }
        if (_.isString(matchData) && _.isString(data)) {
            return data.toUpperCase().indexOf(matchData.toUpperCase()) > -1;
        } else if (_.isArray(matchData) && _.isString(data)) {
            return _.filter(matchData,
                    function(value) {
                        return data.toUpperCase().indexOf(value.toUpperCase()) > -1;
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
            return [].concat(matchData).indexOf(extractValue(data, property)) > -1;
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

function extractValue(data, property) {
    var path = property.split(".");
    var value = data;

    _.each(path, function(p) {
        value = value[p];
    });

    return value;
}
