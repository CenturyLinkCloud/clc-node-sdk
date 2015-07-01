var _ = require('underscore');

module.exports = AccountClient;

function AccountClient (rest) {
    var self = this;

    self.getCustomFields = _.memoize(function () {
        return rest.get('/v2/accounts/{ACCOUNT}/customFields');
    });
}