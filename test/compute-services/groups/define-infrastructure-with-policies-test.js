
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var Promise = require('bluebird');

vcr.describe('Create Infrastructure with Policies Operation [UNIT]', function () {

    it('Should create infrastructure in IL1 DataCenter', function (done) {
        this.timeout(10000000);

        var antiAffinityCriteria = {
            name: "Super Policy"
        };

        var infrastructureConfig = {
            dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
            alertPolicies: [
                {
                    name: 'My Disk Policy',
                    actions: [
                        "user1@company.com", "user2@company.com"
                    ],
                    triggers: [
                        {
                            metric: compute.Policy.Alert.Metric.DISK,
                            duration: 5,
                            threshold: 80
                        }
                    ]
                },
                {
                    name: 'My CPU Policy',
                    actions: [
                        "user1@company.com", "user2@company.com"
                    ],
                    triggers: [
                        {
                            metric: compute.Policy.Alert.Metric.CPU,
                            duration: 15,
                            threshold: 95
                        }
                    ]
                }
            ],
            antiAffinityPolicies: [
                antiAffinityCriteria
            ],
            group: {
                name: 'Group-1',
                description: 'Test Group'
            },
            subItems: [
                {
                    group: 'Group-1-1',
                    subItems: [
                        {
                            name: "web",
                            description: "My web server",
                            template: {
                                operatingSystem: {
                                    family: compute.OsFamily.CENTOS,
                                    version: "6",
                                    architecture: compute.Machine.Architecture.X86_64
                                }
                            },
                            type: compute.Server.HYPERSCALE,
                            machine: {
                                cpu: 1,
                                memoryGB: 1,
                                disks: [
                                    {size: 2}
                                ],
                                antiAffinity: antiAffinityCriteria
                            }
                        }
                    ]
                }
            ]};

        compute
            .groups()
            .defineInfrastructure(infrastructureConfig)
            .then(_.partial(loadParentGroup))
            .then(checkPolicies)
            .then(deleteGroup)
            .then(function () {
                done();
            });
    });

    function loadParentGroup(parentGroupRefs) {
        return compute.groups()._findByRef(_.first(parentGroupRefs), true);
    }

    function checkPolicies(group) {
        return compute.policies().antiAffinity().findSingle({name: "Super Policy"})
            .then(assertAntiAffinityPolicy(group))
            .then(_.partial(Promise.resolve, {}))
            .then(compute.policies().alert().find)
            .then(assertAlertPolicies)
            .then(_.partial(Promise.resolve, group));
    }

    function assertAntiAffinityPolicy(group) {
        return function(policy) {
            assert.equal(policy.id, group.getAllServers()[0].details.antiAffinityPolicy.id);
        };
    }

    function assertAlertPolicies(policies) {
        assert.equal(policies.length, 2);

        _.each(policies, function(policy) {
            assert(["My CPU Policy", "My Disk Policy"].indexOf(policy.name) > -1);
        });
    }

    function deleteGroup (group) {
        compute.groups().delete(group)
            .then(_.partial(Promise.resolve, {}))
            .then(compute.policies().alert().delete)
            .then(_.partial(Promise.resolve, {}))
            .then(compute.policies().antiAffinity().delete);
    }
});
