
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk(/*'cloud_user', 'cloud_user_password'*/).computeServices();
var assert = require('assert');


vcr.describe('Modify Group Operation [UNIT1]', function () {
    var groups = compute.groups();

    vcr.it('Should modify Group1 in DE1 DataCenter', function (done) {
        this.timeout(50 * 1000);

        createGroup1 ()
            .then(changeGroupNameToGroup2)
            .then(assertThatGroupNameChangedToGroup2)

            .then(deleteGroup(done));
    });

    function createGroup1 () {
        return groups
            .create({
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
                name: 'Group1',
                description: 'Test Group'
            })
            .then(assertThatGroupRefIsCorrect);
    }

    function assertThatGroupNameChangedToGroup2 (group) {
        return groups
            .findSingle(group)
            .then(function (metadata) {
                assert.equal(metadata.name, 'Group2');
                return group;
            });
    }

    function changeGroupNameToGroup2(group) {
        return groups.modify(group, {name: 'Group2'});
    }

    function assertThatGroupRefIsCorrect (groupRef) {
        assert(!_.isUndefined(groupRef.id));

        return groupRef;
    }

    function deleteGroup (done) {
        return function (groupCriteria) {
            compute.groups().delete(groupCriteria);
            done();

            return groupCriteria;
        };
    }
});