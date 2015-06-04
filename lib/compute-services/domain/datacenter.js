var Predicate = require('./../../core/predicates/predicates.js');
var _ = require('underscore');

module.exports = DataCenter;

function DataCenter() {

    this.DE_FRANKFURT = {
        id: 'de1',
            name: 'DE1 - Germany (Frankfurt)'
    };

    this.CA_VANCOUVER = {
        id: 'ca1',
        name: 'CA1 - Canada (Vancouver)'
    };

    this.CA_TORONTO_1 = {
        id: 'ca2',
        name: 'CA2 - Canada (Toronto)'
    };

    this.CA_TORONTO_2 = {
        id: 'ca3',
        name: 'CA3 - Canada (Toronto)'
    };

    this.GB_PORTSMOUTH = {
        id: 'gb1',
        name: 'GB1 - Great Britain (Portsmouth)'
    };

    this.GB_SLOUGH = {
        id: 'gb3',
        name: 'GB3 - Great Britain (Slough)'
    };

    this.US_CENTRAL_CHICAGO = {
        id: 'il1',
        name: 'IL1 - US Central (Chicago)'
    };

    this.US_EAST_NEW_YORK = {
        id: 'ny1',
        name: 'NY1 - US East (New York)'
    };

    this.SG_APAC = {
        id: 'sg1',
        name: 'SG1 - APAC (Singapore)'
    };

    this.US_WEST_SANTA_CLARA = {
        id: 'uc1',
        name: 'UC1 - US West (Santa Clara)'
    };

    this.US_CENTRAL_SALT_LAKE_CITY = {
        id: 'ut1',
        name: 'UT1 - US Central (Salt Lake City)'
    };

    this.US_EAST_STERLING = {
        id: 'va1',
        name: 'VA1 - US East (Sterling)'
    };

    this.US_WEST_SEATTLE = {
        id: 'wa1',
        name: 'WA1 - US West (Seattle)'
    };
}

DataCenter.extractPredicateFromCriteria = function(criteria) {
    if (isConditionalCriteria(criteria)) {
        return resolveConditionalCriteria(criteria);
    }
    return resolveFilterCriteria(criteria, 'and');
};

function isConditionalCriteria(criteria) {
    return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
}

function selectDefaultPredicate(condition) {
    return Predicate[condition === "and" ? 'alwaysTrue' : 'alwaysFalse']();
}

function resolveConditionalCriteria(criteria) {
    //extract only 1st criteria
    var value = _.pairs(criteria)[0];
    var condition = value[0];
    var expressions = [].concat(value[1]);

    var predicate = selectDefaultPredicate(condition);

    console.log('resolve conditional criteria :::' + condition);

    _.each(expressions, function(expression) {
        if (isConditionalCriteria(expression)) {
            predicate = predicate[condition](resolveConditionalCriteria(expression));
        } else {
            predicate = predicate[condition](resolveFilterCriteria(expression, condition));
        }
    });

    return predicate;
}

function resolveFilterCriteria(criteria, condition) {
    var predicate = selectDefaultPredicate(condition);
    if (criteria.id) {
        predicate = predicate[condition](Predicate.containsValue(criteria.id, "id"));
    }
    if (criteria.name) {
        predicate = predicate[condition](Predicate.containsValue(criteria.name, "name"));
    }
    if (criteria.nameContains) {
        predicate = predicate[condition](Predicate.contains(criteria.nameContains, "name"));
    }
    if (criteria.where) {
        if (typeof criteria.where !== "function") {
            throw new Error("Criteria.where property must be a function");
        }
        predicate = predicate[condition](new Predicate(criteria.where));
    }

    return predicate;
}
