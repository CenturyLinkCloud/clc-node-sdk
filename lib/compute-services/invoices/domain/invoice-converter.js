
var moment = require('moment');

module.exports = InvoiceConverter;

function InvoiceConverter() {

    var self = this;

    self.convert = function(params) {
        var result = {};

        result.pricingAccountAlias = params.pricingAccountAlias ? params.pricingAccountAlias : null;

        if (params.year === undefined || params.month === undefined) {
            var date = params.date ? moment(params.date) : moment();
            result.year = date.year();
            result.month = date.month();
        } else {
            result.year = params.year;
            result.month = params.month;
        }

        return result;
    };
}