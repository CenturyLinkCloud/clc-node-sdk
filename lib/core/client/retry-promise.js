var Promise = require('bluebird');

var RetryPromise = function (fn, args, opts) {
    opts = opts || {};
    opts.max = opts.max || 5;
    opts.retryInterval = opts.retryInterval || 1000;

    function ServerError(e) {
        return [200,201,204,404].indexOf(e.statusCode) === -1;
    }

    return function () {
        return new Promise(function (resolve, reject) {
            var attempt = function (i) {
                fn.apply(this, args).then(resolve).catch(ServerError, function (err) {
                    if (i >= opts.max) {
                        return reject(err);
                    }
                    setTimeout(function () {
                        attempt(i+1);
                    }, opts.retryInterval);
                });
            };

            attempt(1);
        });
    }();
};

module.exports = RetryPromise;