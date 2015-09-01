
var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CloudJob;

function CloudJob (queueClient, jobInfoData) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        jobInfo = _.extend(Object.create(new StatusResult()), jobInfoData);

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
        return { status: status, job: jobInfo };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'succeeded') {
                resolve(jobInfo);
            } else {
                setTimeout(awaitFn(timeout), timeout || 0);
            }
        };
    }

    self.await = function (timeout) {
        if (jobInfo && jobInfo.isQueued === false) {
            reject(makeJobFailedMessage("notQueued"));
        } else {
            queueClient
                .getStatus(jobInfo.findStatusId())
                .then(_.property('status'))
                .then(onStatusReceived(timeout));
        }

        return self;
    };

    return self;
}

function StatusResult () {

    this.findStatusId = function () {
        return this.operationId || _.findWhere(this.links || [this], {rel: "status"}).id;
    };

}