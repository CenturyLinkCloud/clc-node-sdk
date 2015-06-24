
var OperationPromise = require('./operation-promise.js');

module.exports = NoWaitOperationPromise;

function NoWaitOperationPromise(queueClient, onCompleteFn) {
    var self = new OperationPromise(queueClient, onCompleteFn);

    self.resolveWhenJobCompleted = function(response) {
        setTimeout(function () {
            self.emit('job-queue', response);
            self.processComplete(response);
        });

        return self;
    };

    return self;
}