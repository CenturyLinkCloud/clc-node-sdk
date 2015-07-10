
var _ = require('underscore');
var vcr = require('nock-vcr-recorder-mocha');
var Sdk = require('./../../../lib/clc-sdk.js');
var compute = new Sdk('cloud_user', 'cloud_user_password').computeServices();
var assert = require('assert');
var Promise = require('bluebird');

vcr.describe('Create Infrastructure Operation [UNIT]', function () {

    it('Should create infrastructure in IL1 DataCenter', function (done) {
        this.timeout(10000);

        var Group = compute.Group;
        var infrastructureConfig = {
            dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
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
                                dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
                                operatingSystem: {
                                    family: compute.OsFamily.CENTOS,
                                    version: "6",
                                    architecture: compute.Machine.Architecture.X86_64
                                }
                            },
                            machine: {
                                cpu: 1,
                                memoryGB: 1,
                                disks: [
                                    {size: 2}
                                ]
                            }
                        },
                        {group: 'Group-1-1-1'}
                    ]
                },
                {
                    group: 'Group-1-2',
                    subItems:[
                        mysqlServer(),
                        nginxServer()
                    ]
                }
            ]};

        compute
            .groups()
            .defineInfrastructure(infrastructureConfig)
            .then(_.partial(loadParentGroup, _, infrastructureConfig))
            .then(checkItem)
            .then(_.property('groupId'))
            .then(deleteGroup)
            .then(function () {
                done();
            });
    });

    function mysqlServer() {
        return {
            name: "mysql",
            description: "My SQL Server",
            template: {
                dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
                operatingSystem: {
                    family: compute.OsFamily.CENTOS,
                    version: "6",
                    architecture: compute.Machine.Architecture.X86_64
                }
            },
            machine: {
                cpu: 1,
                memoryGB: 1,
                disks: [
                    {size: 2}
                ]
            },
            count: 2
        };
    }

    function nginxServer() {
        return {
            name: "nginx",
            description: "NGINX Server",
            template: {
                dataCenter: compute.DataCenter.US_CENTRAL_CHICAGO,
                operatingSystem: {
                    family: compute.OsFamily.CENTOS,
                    version: "6",
                    architecture: compute.Machine.Architecture.X86_64
                }
            },
            machine: {
                cpu: 1,
                memoryGB: 1,
                disks: [
                    {size: 2}
                ]
            }
        };
    }

    function loadParentGroup(groupIds, config) {
        return Promise.props({
            item: compute.groups()._findByRef({id: _.first(groupIds)}, true),
            config: config
        });
    }

    function checkItem(props) {
        if (isGroup(props)) {
            checkGroup(props);
        } else {
            checkServer(props);
        }

        return props.config;
    }

    function isGroup(props) {
        return props.item.servers !== undefined;
    }

    function checkSubItem(item, subCfg) {

        var subItems = _.findWhere(item.groups, {name: subCfg.name}) ||
            _.filter(item.servers, function(server) {return server.id.indexOf(subCfg.name) > -1;});

        _.each(_.asArray(subItems), function(subItem) {
            checkItem({item: subItem, config: subCfg});
        });
    }

    function checkGroup(props) {
        var item = props.item;
        var config = props.config;

        var items = _.partition(config.subItems, isServerConfig);
        var actualServersCount = collectServersCount(items[0]);

        assert.equal(item.servers.length, actualServersCount, "check servers count");

        assert.equal(item.groups.length, items[1].length, "check groups count");

        _.each(config.subItems, _.partial(checkSubItem, item));
    }

    function collectServersCount(serverConfigs) {
        return _.reduce(
            serverConfigs,
            function(memo, cfg) {
                return memo + (cfg.count ? cfg.count : 1);
            },
            0
        );
    }

    function checkServer(props) {
        var item = props.item;
        var config = props.config;

        //assert.equal(item.groupId, config.groupId);
        assert.equal(item.description, config.description);
    }

    function isServerConfig(config) {
        return config.template !== undefined;
    }

    function deleteGroup (groupId) {
        compute.groups().delete({id: groupId});
    }
});
