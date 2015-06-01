
var _ = require('underscore');
var Promise = require('bluebird').Promise;

module.exports = _;

_.mixin({
    arrayPromise: function (promises) {
        return Promise.all(promises);
    },
    then: function (promise, successFn, errorFn) {
        return promise.then(successFn || _.noop, errorFn || _.noop);
    }
});