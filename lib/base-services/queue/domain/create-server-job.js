
var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreateServerJob;

function CreateServerJob (serverClient, server) {
    var self,
        resolve = _.noop,
        reject = _.noop;

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
        return _.partial(self.await, timeout || 5000);
    }

    function makeJobFailedMessage(status) {
        return { status: status, job: server };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'active') {
                resolve(server);
            } else if (isJobFailed(status)) {
                reject(makeJobFailedMessage(status));
            } else {
                setTimeout(awaitFn(timeout), timeout || 0);
            }
        };
    }

    self.await = function (timeout) {
        serverClient
            .findServerById(server.id)
            .then(_.property('status'))
            .then(onStatusReceived(timeout));

        return self;
    };

    return self;
}