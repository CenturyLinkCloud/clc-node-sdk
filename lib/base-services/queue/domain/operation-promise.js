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
                if (self.jobs.length > 0) {
                    Promise.all(_.map(self.jobs, function(job) {
                        var jobResult = job(result);
                        //is job
                        if (jobResult.await) {
                            return jobResult.await();
                        }
                        return jobResult;
                    })).then(resolve);

                    delete self.jobs;
                } else {
                    resolve(result);
                }
            });

            emitter.on('error', function (errors) {
                reject(errors);
            });
        });

        _.each(emitterMethods, function(method) {
            self[method] = _.bind(emitter[method], emitter);
        });

        if (typeof onCompleteFn === "string") {
            operationName = onCompleteFn;
            onCompleteFn = undefined;
        }

        self.jobs = [];
    }

    init ();

    function awaitCloudJob (curJobInfo) {
        return new CloudJob(queueClient, curJobInfo).await();
    }

    self.addJobFn = function(job) {
        self.jobs.push(job);

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
            self.processErrors(errors);
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

    function logErrors(response) {
        console.error("The operation " + (operationName ? ("*" + operationName + "* ") : "") + "was failed:");
        _.each(_.asArray(response), processError);
    }

    self.processErrors = function(response) {
        logErrors(response);

        var processedErrors = _.chain(response)
            .asArray()
            .each(function(err) {
                err.operationName = operationName;
            })
            .value();

        self.emit('error', processedErrors);
    };

    function processError(response) {
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
    }

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