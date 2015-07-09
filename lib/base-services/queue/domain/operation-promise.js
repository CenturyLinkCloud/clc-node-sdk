var _ = require('underscore');
var Promise = require("bluebird");
var events = require('events');
var EventEmitter = events.EventEmitter;
var CloudJob = require('./cloud-job.js');

module.exports = OperationPromise;

function OperationPromise(queueClient, onCompleteFn) {
    var self,
        emitter = new EventEmitter(),
        emitterMethods = ['on', 'emit'];

    function init () {
        self = new Promise(function (resolve, reject) {
            emitter.on('complete', function (result) {
                if (self.job) {
                    self.job(result).await().then(resolve);
                    delete self.job;
                } else {
                    resolve(result);
                }
            });

            emitter.on('error', function (error) {
                reject(error);
            });
        });

        _.each(emitterMethods, function(method) {
            self[method] = _.bind(emitter[method], emitter);
        });
    }

    init ();

    function awaitCloudJob (curJobInfo) {
        return new CloudJob(queueClient, curJobInfo).await();
    }

    self.setJobFn = function(job) {
        self.job = job;

        return self;
    };

    self.from = function (promise) {
        promise.then(self.resolveWhenJobCompleted, self.processErrors);
        return this;
    };

    self.resolveWhenJobCompleted = function(jobInfo) {
        self.emit('job-queue', jobInfo);

        if (jobInfo instanceof Array) {
            Promise
                .all(jobInfo.map(awaitCloudJob))
                .then(self.processComplete, self.processErrors);
        } else {
            awaitCloudJob(jobInfo)
                .then(self.processComplete, self.processErrors);
        }

        return self;
    };

    self.processErrors = function(response) {
        var details;
        if (response.data) {
            details = response.data;
        }
        if (response.job) {
            details = response.job;
        }

        throw new Error("The request was failed " + response +
            (details ? ". Details: " + JSON.stringify(details) : ""));
    };

    self.processComplete = function (response) {
        if (onCompleteFn) {
            Promise.resolve(onCompleteFn(response)).then(function (result) {
                emitter.emit('complete', result);
            });
        } else {
            emitter.emit('complete', response);
        }
    };

    return self;
}