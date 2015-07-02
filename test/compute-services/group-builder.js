
var _ = require('underscore');

module.exports = GroupBuilder;

function GroupBuilder (compute) {
    var self = this;
    var group;

    self.createGroup = function (configCustomization) {
        var DataCenter = compute.DataCenter;
        var Server = compute.Server;
        var Group = compute.Group;
        var OsFamily = compute.OsFamily;
        var Machine = compute.Machine;

        return compute
            .groups()
            .create(_.extend({
                parentGroup: {
                    dataCenter: DataCenter.DE_FRANKFURT,
                    name: Group.DEFAULT
                },
                name: 'MyGroup',
                description: 'My Group Description'
            }, configCustomization))
            .then(function (createdGroup) {
                return group = createdGroup;
            });
    };

    self.deleteGroup = function (done) {
        return function () {
            return compute
                .groups()
                .delete(group)
                .then(function () {
                    done();
                });
        };
    };

}