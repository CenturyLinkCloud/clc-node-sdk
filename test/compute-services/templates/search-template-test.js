
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();

describe('Search templates test', function () {

    it('Should return list of all "de1" templates', function (done) {
        this.timeout(1000 * 60 * 15);

        compute
            .templates()
            .find({
                dataCenterIds: 'de1',
            })
            .then(console.log)
            .then(function () {
                done();
            });
    });

});