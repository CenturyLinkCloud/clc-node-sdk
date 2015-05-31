
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var events = require('events');
var EventEmitter = events.EventEmitter;

module.exports = ServerService;


function ServerService (rest) {
    var self = this;
    var serverClient = new ServerClient(rest);

    function preprocessResult(list) {
        return (list.length == 1) ? list[0] : list
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

    self.create = function (command) {
        var emitter = new EventEmitter();

        serverClient
            .createServer(command)
            .then(function (response) {
                emitter.emit('job-queue', response);
            })
            .catch(function (response) {
                emitter.emit('error', response);
            });

        return emitter;
    };
}