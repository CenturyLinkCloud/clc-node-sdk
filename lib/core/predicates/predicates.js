
var _ = require('underscore');

module.exports = Predicate;

function Predicate (predicateFn) {
    var self = this;

    self.fn = predicateFn;

    self.and = function (otherPredicate) {
        return new Predicate(function () {
            return predicateFn.apply(self, arguments) && otherPredicate.fn.apply(self, arguments);
        });
    };

    self.or = function (otherPredicate) {
        return new Predicate(function () {
            return predicateFn.apply(self, arguments) || otherPredicate.fn.apply(self, arguments);
        });
    };
}

Predicate.alwaysTrue = _.constant(new ConstPredicate(true));

Predicate.alwaysFalse = _.constant(new ConstPredicate(false));

Predicate.and = function () {
    return _.chain([arguments])
        .flatten()
        .reduce(function (memo, item) {
            return memo.and(item);
        }, Predicate.alwaysTrue())
        .value();
};

Predicate.or = function () {
    return _.chain([arguments])
        .flatten()
        .reduce(function (memo, item) {
            return memo.or(item);
        }, Predicate.alwaysFalse())
        .value();
};


function ConstPredicate (value) {
    var self = this;

    function init () {
        Predicate.call(self, _.constant(value));
    }

    init ();
}


