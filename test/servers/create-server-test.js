
var Sdk = require('sdk.js');
var compute = new Sdk().computeManagement();

describe('Search servers operation', function () {

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

});