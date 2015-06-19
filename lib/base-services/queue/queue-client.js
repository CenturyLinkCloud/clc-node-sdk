
module.exports = QueueClient;


function QueueClient (rest) {
    var self = this;

    self.getStatus = function (statusId) {
        return rest.get('/v2/operations/{ACCOUNT}/status/' + statusId);
    };
}