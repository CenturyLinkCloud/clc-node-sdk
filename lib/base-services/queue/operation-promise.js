var _ = require('underscore');
var Promise = require("bluebird");
var events = require('events');
var EventEmitter = events.EventEmitter;

module.exports = OperationPromise;

function OperationPromise(queueClient, onCompleteFn) {
    var self,
        emitter = new EventEmitter(),
        emitterMethods = ['on', 'emit'];

    function init () {
        self = new Promise(function (resolve, reject) {
            emitter.on('complete', function (result) {
                resolve(result);
            });

            emitter.on('error', function (error) {
                reject(error);
            });
        });
    }

    init ();

    _.each(emitterMethods, function(method) {
        self[method] = _.bind(emitter[method], emitter);
    });

    self.resolveWhenJobCompleted = function(response) {
        self.emit('job-queue', response);

        pingStatus(self, self.mixinStatusSupport(response));

        return self;
    };

    self.processErrors = function(response) {
        //throw new Error("The request was failed");
        return self;
    };

    function pingStatus(emitter, response) {
        queueClient
            .getStatus(response.findStatusId())
            .then(function (response) {
                return response.status;
            })
            .then(function (status) {
                if (status === 'succeeded') {
                    if (onCompleteFn) {
                        onCompleteFn(response.findSelfId()).then(function (result) {
                            emitter.emit('complete', result);
                        });
                    } else {
                        emitter.emit('complete', response);
                    }
                } else if (!status || status === 'failed' || status === 'unknown') {
                    emitter.emit('error', {status: status, job: response});
                } else {
                    setTimeout(_.partial(pingStatus, emitter, response), 5000);
                }
            });

        return response;
    }

    self.mixinStatusSupport = function (data) {
        return _.extend(Object.create(new StatusResult()), data);
    };

    return self;
}

function StatusResult () {

    this.findStatusId = function () {
        return _.findWhere(this.links, {rel: "status"}).id;
    };

    this.findSelfId = function () {
        return _.findWhere(this.links, {rel: "self"}).id;
    };

}