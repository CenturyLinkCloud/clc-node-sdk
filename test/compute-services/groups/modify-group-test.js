
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk(/*'cloud_user', 'cloud_user_password'*/).computeServices();
var assert = require('assert');


vcr.describe('Modify Group Operation [UNIT1]', function () {
    var groups = compute.groups();

    vcr.it('Should modify group name', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup, {name: 'Group1'}))

            .then(_.partial(modifyGroup, {name: 'Group2'}))

            .then(assertThatGroupNameIs('Group2'))

            .then(deleteGroup(done));
    });

    vcr.it('Should modify group name and description together by one call', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup, {name: 'Group1', description: 'Desc1'}))

            .then(_.partial(modifyGroup, {name: 'Group2', description: 'Desc2'}))

            .then(assertThatGroupNameIs('Group2'))
            .then(assertThatDescriptionIs('Desc2'))

            .then(deleteGroup(done));
    });

    function assertGroup (callback) {
        return function (group) {
            return groups
                .findSingle(group)
                .then(function (metadata) {
                    callback(metadata);
                    return group;
                });
        };
    }

    function assertThatDescriptionIs(expectedDescription) {
        return assertGroup(function (metadata) {
            assert.equal(metadata.description, expectedDescription);
        });
    }

    function createGroup (config) {
        return groups
            .create(_.extend({
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
                name: 'Group1',
                description: 'Test Group'
            }, config))
            .then(assertThatGroupRefIsCorrect);
    }

    function assertThatGroupNameIs (name) {
        return assertGroup(function (metadata) {
            assert.equal(metadata.name, name);
        });
    }

    function modifyGroup(config, group) {
        return groups.modify(group, config);
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