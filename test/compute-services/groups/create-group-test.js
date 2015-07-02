
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');


vcr.describe('Create Group Operation [UNIT]', function () {
    it('Should create Group1 in DE1 DataCenter', function (done) {
        this.timeout(50 * 1000);

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
        this.timeout(50 * 1000);

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

    function assertThatGroupWithCustomFields(group) {
        assert.equal(group.customFields.length, 1);

        assert.equal(group.customFields[0].name, "Approved by");
        assert.equal(group.customFields[0].value, "test");

        return group;
    }

    function assertThatGroupRefIsCorrect (groupRef) {
        assert(!_.isUndefined(groupRef.id));

        return groupRef;
    }

    function deleteGroup (groupCriteria) {
        compute.groups().delete(groupCriteria);

        return groupCriteria;
    }
});
