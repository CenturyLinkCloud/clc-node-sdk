
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

Predicate.alwaysTrue = new ConstPredicate(true);
Predicate.alwaysFalse = new ConstPredicate(false);


function ConstPredicate (value) {
    var self = this;

    self.fn = _.constant(value);
}


