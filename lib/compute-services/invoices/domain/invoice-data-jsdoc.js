
/**
 * @typedef InvoiceData
 * @type {object}
 *
 * @property {String} id - ID of the account alias being queried
 * @property {String} terms - payment terms associated with the account
 * @property {String} companyName - description of the account name
 * @property {String} accountAlias - Short code for a particular account
 * @property {String} pricingAccountAlias - Short code for a particular account that receives the bill for the accountAlias usage
 * @property {String} parentAccountAlias - Short code for the parent account alias associated with the account alias being queried
 * @property {String} address1 - First line of the address associated with accountAlias
 * @property {String} address2 - Second line of the address associated with accountAlias
 * @property {String} city - City associated with the accountAlias
 * @property {String} stateProvince - State or province associated with the accountAlias
 * @property {String} postalCode - Postal code associated with the accountAlias
 * @property {String} billingContactEmail - Billing email address associated with the accountAlias
 * @property {String} invoiceCCEmail - Additional billing email address associated with the accountAlias
 * @property {Number} totalAmount - Invoice amount in dollars
 * @property {String} invoiceDate - Date the invoice is finalized
 * @property {String} poNumber - Purchase Order associated with the Invoice
 * @property {Array} Usage details of a resource or collection of similar resources
 *
 * @example
 * {
 *   "id": "ALIAS69849A66",
 *   "terms": "Net 15",
 *   "companyName": "CTL Cloud Solutions",
 *   "accountAlias": "ALIAS",
 *   "pricingAccountAlias": "ALIAS",
 *   "parentAccountAlias": "PALIAS",
 *   "address1": "1100 112th Ave NE",
 *   "address2": "Suite 400",
 *   "city": "Bellevue",
 *   "stateProvince": "WA",
 *   "postalCode": "98004",
 *   "billingContactEmail": "billing@domain.com",
 *   "invoiceCCEmail": "",
 *   "totalAmount": 0,
 *   "invoiceDate": "2015-08-01T00:00:00Z",
 *   "poNumber": "",
 *   "lineItems": [
 *       {
 *           "quantity": 1,
 *           "description": "Server Group: DEMO - VA1",
 *           "unitCost": 153.93,
 *           "itemTotal": 153.93,
 *           "serviceLocation": "VA1",
 *           "itemDetails": [
 *               {
 *                   "description": "VA1ALIASJMB01",
 *                   "cost": 153.93
 *               }
 *           ]
 *       },
 *       {
 *           "quantity": 1,
 *           "description": "Shared Load Balancer - CA1",
 *           "unitCost": 29.76,
 *           "itemTotal": 29.76,
 *           "serviceLocation": "CA1",
 *           "itemDetails": []
 *       },
 *       {
 *           "quantity": 1,
 *           "description": "Additional Networks - GB3",
 *           "unitCost": 45,
 *           "itemTotal": 45,
 *           "serviceLocation": "GB3",
 *           "itemDetails": []
 *       },
 *   ]
 * }
 */