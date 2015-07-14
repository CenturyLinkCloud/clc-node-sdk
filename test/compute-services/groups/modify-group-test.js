
var _ = require('underscore');
var Promise = require('bluebird').Promise;
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Modify group Operation [UNIT]', function () {
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

    vcr.it('Should modify group name, description and custom fields together by one call', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup,
                {
                    name: 'Group1',
                    description: 'Desc1',
                    customFields: [
                        {
                            name: "Approved by",
                            value: "test"
                        }
                    ]
                })
            )

            .then(_.partial(modifyGroup,
                {
                    name: 'Group2',
                    description: 'Desc2',
                    customFields: [
                        {
                            where: function(field) {
                                return field.type === "text";
                            },
                            value: "test2"
                        }
                    ]
                }))

            .then(assertThatGroupNameIs('Group2'))
            .then(assertThatDescriptionIs('Desc2'))
            .then(assertThatGroupCustomFieldIs("test2"))

            .then(deleteGroup(done));
    });

    vcr.it('Should change parent group', function (done) {
        this.timeout(50 * 1000);

        Promise.resolve()
            .then(_.partial(createGroup, { parentGroup: groupInDE1(Group.DEFAULT) }))

            .then(_.partial(modifyGroup, { parentGroup: groupInDE1('DE1 Hardware') }))

            .then(assertThatParentGroupIs('DE1 Hardware'))

            .then(deleteGroup(done));
    });

    function groupInDE1 (name) {
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

    function parentGroupIdOf(actualGroupMetadata) {
        return _.findWhere(actualGroupMetadata.links, {rel: 'parentGroup'}).id;
    }

    function assertThatParentGroupIs(expectedGroupName) {
        return assertGroup(function (actualGroup) {
            return groups
                .findSingle({dataCenter: DataCenter.DE_FRANKFURT, name: expectedGroupName})
                .then(function (expectedGroup) {
                    assert.equal(parentGroupIdOf(actualGroup), expectedGroup.id);

                    return { id: actualGroup.id };
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

    function assertThatGroupCustomFieldIs (value) {
        return assertGroup(function (metadata) {
            assert.equal(metadata.customFields.length, 1);
            assert.equal(metadata.customFields[0].value, value);
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
            return groups.delete(groupCriteria).then(_.partial(done, undefined));
        };
    }
});