
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();

describe('Search templates test [INTEGRATION, LONG_RUNNING]', function () {

    it('Should return list of all "de1" templates', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .find({
                dataCenterIds: compute.DataCenter.DE_FRANKFURT
            })
            .then(console.log)
            .then(function () {
                done();
            });
    });

});