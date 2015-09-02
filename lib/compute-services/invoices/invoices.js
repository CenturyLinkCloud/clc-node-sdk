
var InvoiceConverter = require('./domain/invoice-converter.js');

module.exports = Invoices;

/**
 * The service that works with account invoices
 *
 * @constructor
 */
function Invoices (serverClient) {
    var self = this;

    function init () {}

    /**
     * Gets a list of invoicing data for a given account alias for a given month
     * @param {Object} params - invoice params
     * @example
     * {
     *     year: 2015,
     *     month: 7,
     *     pricingAccountAlias: 'PALIAS'
     * }
     * {
     *     date: moment().subtract(2, 'months')
     * }
     * {
     *     date: new Date('2015-09-01T03:24:00')
     * }
     * @returns {Promise<InvoiceData>} - promise that resolved by InvoiceData.
     *
     * @instance
     * @function getInvoice
     * @memberof Invoices
     */
    self.getInvoice = function (params) {
        var convertedParams = new InvoiceConverter().convert(params);

        return serverClient.getInvoice(
            convertedParams.year,
            convertedParams.month,
            convertedParams.pricingAccountAlias
        );
    };

    init();
}
