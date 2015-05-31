
var Sdk = require('./../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();


describe('Create server command', function () {

    it('Should create new server', function () {
        compute
            .servers()
            .find({
                id: ['A1', 'A2', 'B4', 'B5'],
                name: 'BLABLABLA',
                descriptionContains: 'BLABLABLA',
                where: function (metadata) {
                    return metadata.getDescription() === null;
                },
                onlyActive: true,
                powerState: ['STARTED', compute.SERVER_STATE.PAUSED]
            })
            .on('complete', function (result) {

            });
    });

    it('Should find server by ID reference', function (done) {
        compute.servers()
            .findByRef({ id: 'DE1ALTDCTTL577' })
            .then(console.log)
            .then(function () {
                done();
            });
    });

});