
var _ = require('underscore');
var Promise = require('bluebird').Promise;

module.exports = _;

_.mixin({
    arrayPromise: function (promises) {
        return Promise.all(promises);
    },
    then: function (promise, successFn, errorFn) {
        return promise.then(successFn || _.noop, errorFn || _.noop);
    },
    asArray: function() {
        return _.flatten([arguments]);
    },
    applyMixin: function(Class, data) {
        if (data instanceof Array) {
            return _.map(_.asArray(data), function(arg) {
                return _.extend(Object.create(new Class()), arg);
            });
        }

        return _.extend(Object.create(new Class()), data);
    }
});