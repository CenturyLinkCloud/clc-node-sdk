var _ = require('underscore');
var Promise = require("bluebird");
var events = require('events');
var EventEmitter = events.EventEmitter;
var CloudJob = require('./cloud-job.js');

module.exports = OperationPromise;

function OperationPromise(queueClient, onCompleteFn, operationName) {
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

        if (typeof onCompleteFn === "string") {
            operationName = onCompleteFn;
            onCompleteFn = undefined;
        }
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
        return self;
    };

    self.fromInspections = function (promise) {
        promise.then(resolvePromiseInspections);
        return self;
    };

    function resolvePromiseInspections(results) {

        var allPromiseInspections = _.partition(results, function(result) {
            return result.isFulfilled();
        });

        var errors = _.chain(allPromiseInspections[1])
            .map(function(inspection) {
                return inspection.error();
            })
            .value();

        if (errors.length > 0) {
            console.error("The operation " + (operationName ? ("*" + operationName + "* ") : "") + "was failed:");
            _.each(errors, self.processErrors);

            self.emit('error', errors);
        } else {
            var jobInfo = _.chain(allPromiseInspections[0])
                .map(function(inspection) {
                    return inspection.value();
                })
                .value();

            self.resolveWhenJobCompleted(jobInfo);
        }

    }

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

        var errorMessage = "The request was failed " + response +
                    (details ? ". Details: " + JSON.stringify(details) : "");

        console.error(errorMessage);
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