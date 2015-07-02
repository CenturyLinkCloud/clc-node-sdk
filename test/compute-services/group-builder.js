
var _ = require('underscore');
var assert = require('assert');


module.exports = GroupBuilder;

function GroupBuilder (compute) {
    var self = this;
    var group;

    self.createGroup = function (configCustomization) {
        var DataCenter = compute.DataCenter;
        var Group = compute.Group;

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
                .then(function (groupRef) {
                    assert(!!groupRef[0].id);
                    done();
                });
        };
    };

}