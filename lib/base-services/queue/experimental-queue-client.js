
module.exports = ExperimentalQueueClient;


function ExperimentalQueueClient(rest) {
    var self = this;

    self.getStatus = function (statusId) {
        return rest.get('/v2-experimental/operations/{ACCOUNT}/status/' + statusId);
    };
}

