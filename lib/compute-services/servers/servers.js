
var _ = require('underscore');
var Promise = require("bluebird");
var ServerClient = require('./server-client.js');
var OperationPromise = require('./../operation-promise.js');
var QueueClient = require('./../../common-services/queue/queue-client.js');

module.exports = Servers;


function Servers(rest) {
    var self = this;
    var serverClient = new ServerClient(rest);
    var queueClient = new QueueClient(rest);

    function preprocessResult(list) {
        return (list.length == 1) ? list[0] : list;
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
        var promise = new OperationPromise(queueClient, self.findByUuid);

        serverClient.createServer(command)
            .then(promise.resolveWhenJobCompleted , promise.processErrors);

        return promise.then(function(response) {
            return {id:response.id};
        });
    };

    self.delete = function (server) {
        var promise = new OperationPromise(queueClient);

        serverClient
            .deleteServer(server.id)
            .then(promise.resolveWhenJobCompleted , promise.processErrors);

        return promise;
    };
}