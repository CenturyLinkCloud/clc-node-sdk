
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var GroupBuilder = require('./../group-builder.js');


vcr.describe('Create Group Operation [UNIT]', function () {
    var timeout = 15 * 60 * 1000;

    it('Should create Group1 in DE1 DataCenter', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .create({
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
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

    it('Should create Group1 in DE1 DataCenter with custom fields', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .create({
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    name: compute.Group.DEFAULT
                },
                name: 'Group1 Custom',
                description: 'Test Group with Custom Fields',
                customFields: [
                    {
                        name: "Approved by",
                        value: "test"
                    },
                    {
                        where: function(field) {
                            return field.type === "text";
                        },
                        value: "test2"
                    }
                ]
            })
            .then(assertThatGroupRefIsCorrect)
            .then(function(groupRef) {
                return compute.groups().findSingle(groupRef);
            })
            .then(assertThatGroupWithCustomFields)

            .then(deleteGroup)
            .then(assertThatGroupRefIsCorrect)

            .then(function () {
                done();
            });
    });

    it('Should create group in DE1 in root group', function (done) {
        this.timeout(timeout);

        compute
            .groups()
            .create({
                parentGroup: {
                    dataCenter: compute.DataCenter.DE_FRANKFURT,
                    rootGroup: true
                },
                name: 'Test Group'
            })
            .then(assertThatGroupRefIsCorrect)
            .then(compute.groups().findSingle)
            .then(assertThatGroupInRoot)

            .then(deleteGroup)
            .then(assertThatGroupRefIsCorrect)

            .then(function () {
                done();
            });
    });

    it('Should delete specified group', function (done) {
        this.timeout(timeout);

        var groupBuilder = new GroupBuilder(compute);

        groupBuilder
            .createGroup()
            .then(assertThatGroupRefIsCorrect)

            .then(groupBuilder.deleteGroup(done));
    });

    function assertThatGroupInRoot(group) {
        return compute.groups().findSingle({id: group.getParentGroupId()})
            .then(function(rootGroup) {
                assert.equal(rootGroup.id, group.getParentGroupId());
                assert.equal(rootGroup.getParentGroupId(), null);

                return group;
            });
    }

    function assertThatGroupWithCustomFields(group) {
        assert.equal(group.customFields.length, 1);

        assert.equal(group.customFields[0].name, "Approved by");
        assert.equal(group.customFields[0].value, "test");

        return group;
    }

    function assertThatGroupRefIsCorrect (groupRefValue) {
        var groupRef = groupRefValue instanceof Array ? groupRefValue[0] : groupRefValue;
        assert(!_.isUndefined(groupRef.id));

        return groupRef;
    }

    function deleteGroup (groupCriteria) {
        return compute.groups().delete(groupCriteria);
    }
});
