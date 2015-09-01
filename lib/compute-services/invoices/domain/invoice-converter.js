
var moment = require('moment');

module.exports = InvoiceConverter;

function InvoiceConverter() {

    var self = this;

    self.convert = function(params) {
        var result = {};

        result.pricingAccountAlias = params.pricingAccountAlias || null;

        if (params.year === undefined || params.month === undefined) {
            var date = params.date ? moment(params.date) : moment();
            result.year = date.year();
            /* Due to momentjs accepts numbers from 0 to 11 for months */
            result.month = date.month() + 1;
        } else {
            result.year = params.year;
            result.month = params.month;
        }

        return result;
    };
}