
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Create Group Operation [UNIT]', function () {
    it('Should create Group1 in DE1 DataCenter', function (done) {
        this.timeout(20 * 1000);

        compute
            .groups()
            .create({
                parentGroupId: 'e9cf5a7a9fad43a8a9184d0265ae076c',
                name: 'Group1',
                description: 'Test Group'
            })
            .then(assertThatGroupRefIsCorrect)

            .then(deleteGroup)
            .then(assertThatGroupRefIsCorrect)

            .then(function () {
                done();
            });
    });

    function assertThatGroupRefIsCorrect (groupRef) {
        assert(!_.isUndefined(groupRef.id));

        return groupRef;
    }

    function deleteGroup (groupCriteria) {
        compute.groups().delete(groupCriteria);

        return groupCriteria;
    }
});
