
var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreateLoadBalancerJob;

function CreateLoadBalancerJob (loadBalancerService, result) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        defaultTimeout = 5000;

    function init () {
        self = new Promise(saveResolveFn);
    }
    init ();

    function saveResolveFn(resolveFn, rejectFn) {
        resolve = resolveFn;
        reject = rejectFn;
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || defaultTimeout);
    }

    self.await = function (timeout) {
        loadBalancerService
            .findSingle(result)
            .then(resolve)
            .catch(function(err) {
                setTimeout(awaitFn(timeout), timeout || defaultTimeout);
            }
        );

        return self;
    };

    return self;
}