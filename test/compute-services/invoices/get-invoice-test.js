
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var _ = require('underscore');
var moment = require('moment');

vcr.describe('Get invoice [UNIT]', function () {

    it('Should return invoice data for previous month', function (done) {
        this.timeout(10000);

        compute
            .invoices()
            .getInvoice(
                {
                    year: 2015,
                    month: 7
                }
            )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(invoiceData) {
            assert(invoiceData != null);
            assert.equal(invoiceData.invoiceDate, '2015-08-01T00:00:00Z');
        }
    });

    it('Should return invoice data by moment date param', function (done) {
        this.timeout(10000);

        compute
            .invoices()
            .getInvoice(
            {
                date: moment().year(2015).month(5)
            }
        )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(invoiceData) {
            assert(invoiceData != null);
            assert.equal(invoiceData.invoiceDate, '2015-06-01T00:00:00Z');
        }
    });

    it('Should return invoice data for current account', function (done) {
        this.timeout(50000);

        /* TODO find an ability to fetch current account alias */
        var accountAlias = 'ALTD';

        compute
            .invoices()
            .getInvoice(
            {
                year: 2015,
                month: 3,
                pricingAccountAlias: accountAlias
            }
        )
            .then(checkAsserts)
            .then(done);

        function checkAsserts(invoiceData) {
            assert(invoiceData != null);
            assert.equal(invoiceData.invoiceDate, '2015-04-01T00:00:00Z');
            assert.equal(invoiceData.pricingAccountAlias, accountAlias);
        }
    });
});