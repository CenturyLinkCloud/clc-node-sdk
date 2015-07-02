
var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CloudJob;

function CloudJob (queueClient, jobInfoData) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        jobInfo = _.extend(Object.create(new StatusResult()), jobInfoData);

    function init () {
        self = new Promise(function (resolveFn, rejectFn) {
            resolve = resolveFn;
            reject = rejectFn;
        });
    }
    init ();

    self.await = function (timeout) {
        queueClient
            .getStatus(jobInfo.findStatusId())
            .then(_.property('status'))
            .then(function (status) {
                if (status === 'succeeded') {
                    resolve(jobInfo);
                } else if (!status || status === 'failed' || status === 'unknown') {
                    reject({status: status, job: jobInfo});
                } else {
                    setTimeout(_.partial(self.await, timeout || 5000), timeout || 0);
                }
            });

        return self;
    };

    return self;
}

function StatusResult () {

    this.findStatusId = function () {
        return _.findWhere(this.links || [this], {rel: "status"}).id;
    };

}