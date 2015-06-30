
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify Group Operation [UNIT]', function () {
    var groups = compute.groups();
    var DataCenter = compute.DataCenter;
    var Group = compute.Group;

    vcr.it('Should modify group name', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup, {name: 'Group1'}))

            .then(_.partial(modifyGroup, {name: 'Group2'}))

            .then(assertThatGroupRefIsCorrect)
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

    vcr.it('Should change group parent', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup, { parentGroup: de1Group(Group.DEFAULT) }))

            .then(_.partial(modifyGroup, { parentGroup: de1Group('DE1 Hardware') }))

            .then(assertThatParentGroupIs('DE1 Hardware'))

            .then(deleteGroup(done));
    });

    function de1Group (name) {
        return { dataCenter: DataCenter.DE_FRANKFURT, name: name };
    }

    function assertGroup (callback) {
        return function (group) {
            return groups
                .findSingle(group)
                .then(function (metadata) {
                    return callback(metadata) || group;
                });
        };
    }

    function assertThatParentGroupIs(expectedGroupName) {
        return assertGroup(function (metadata) {
            return groups
                .findSingle({dataCenter: DataCenter.DE_FRANKFURT, name: expectedGroupName})
                .then(function (expectedGroup) {
                    assert.equal(_.findWhere(metadata.links, {rel: 'parentGroup'}).id, expectedGroup.id);
                    return { id: metadata.id };
                });
        });
    }

    function assertThatDescriptionIs(expectedDescription) {
        return assertGroup(function (metadata) {
            assert.equal(metadata.description, expectedDescription);
        });
    }

    function createGroup (config) {
        return groups
            .create(_.defaults(config, {
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
                name: 'Group1',
                description: 'Test Group'
            }))
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
        assert(!_.isUndefined(groupRef.id || groupRef[0].id));

        return groupRef;
    }

    function deleteGroup (done) {
        return function (groupCriteria) {
            groups.delete(groupCriteria);
            done();

            return groupCriteria;
        };
    }
});