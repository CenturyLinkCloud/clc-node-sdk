
var _ = require('underscore');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk().computeServices();
var assert = require('assert');
var ServerBuilder = require('./../server-builder.js');

describe('SSH client operation [INTEGRATION]', function () {

    var builder = new ServerBuilder(compute);

    it('Should execute commands through SSH', function (done) {
        this.timeout(3 * 60 * 1000);

        compute.servers()
            .find({
                dataCenter: compute.DataCenter.DE_FRANKFURT,
                onlyActive: true
            })
            .then(function(result) {
                if (result.length === 0) {
                    return builder.createCentOsVm({})
                        .then(compute.servers().findSingle);
                }
                return _.sample(result, 2);
            })
            .then(function(servers) {
                return compute.servers()
                    .execSsh(servers)
                    .run(['cd ~;ls', 'ls -l', 'ls -all']).then(function(result) {
                        console.log(JSON.stringify(result, null, 2));
                    })
                    .run('ls -all').then(function(result) {
                        console.log(JSON.stringify(result, null, 2));
                    });
            })
            .then(done);
    });

});