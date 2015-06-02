
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var events = require('events');
var EventEmitter = events.EventEmitter;
var QueueClient = require('./../../common-services/queue/queue-client.js');

module.exports = Servers;


function Servers(rest) {
    var self = this;
    var serverClient = new ServerClient(rest);
    var queueClient = new QueueClient(rest);

    function preprocessResult(list) {
        return (list.length == 1) ? list[0] : list
    }

    function pingStatus (emitter, response) {
        queueClient
            .getStatus(response.findStatusId())
            .then(function (response) {
                return response.status;
            })
            .then(function (status) {
                if (status === 'succeeded') {
                    emitter.emit('complete', response);
                } else if (!status || status === 'failed' || status === 'unknown') {
                    emitter.emit('error', {status: status, job: response})
                } else {
                    setTimeout(_.partial(pingStatus, emitter, response), 5000);
                }
            });

        return response;
    }

    self.findByRef = function () {
        var promises = _.chain([arguments])
            .flatten()
            .map(function (reference) {
                return serverClient.findServerById(reference.id);
            })
            .value();

        return Promise.all(promises).then(preprocessResult);
    };

    self.findByUuid = function(uuid) {

        return serverClient
            .findServerByUuid(uuid)
            .then(preprocessResult);
    };

    self.create = function (command) {
        var emitter = new EventEmitter();

        serverClient
            .createServer(command)
            .then(rest.mixinStatusSupport)
            .then(function (response) {
                emitter.emit('job-queue', response);
                return response;
            })
            .then(_.partial(pingStatus, emitter))
            .catch(function (response) {
                emitter.emit('error', response);
            });

        return emitter;
    };

    self.delete = function (server) {
        var emitter = new EventEmitter();

        serverClient
            .deleteServer(server.id)
            .then(rest.mixinStatusSupport)
            .then(function (response) {
                emitter.emit('job-queue', response);
                return response;
            })
            .then(_.partial(pingStatus, emitter))
            .catch(function (response) {
                emitter.emit('error', response);
            });

        return emitter;
    }
}