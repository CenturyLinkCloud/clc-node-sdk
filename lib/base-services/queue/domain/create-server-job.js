
var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreateServerJob;

function CreateServerJob (serverClient, result) {
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

    function isJobFailed(status) {
        return !status || status === 'failed' || status === 'unknown';
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || defaultTimeout);
    }

    function makeJobFailedMessage(status) {
        return { status: status, job: result };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'active') {
                resolve(result);
            } else if (isJobFailed(status)) {
                reject(makeJobFailedMessage(status));
            } else {
                setTimeout(awaitFn(timeout), timeout || defaultTimeout);
            }
        };
    }

    self.await = function (timeout) {
        serverClient
            .findServerById(result.id)
            .then(_.property('status'))
            .then(onStatusReceived(timeout));

        return self;
    };

    return self;
}