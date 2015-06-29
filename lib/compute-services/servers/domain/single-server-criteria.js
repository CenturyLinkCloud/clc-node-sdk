
var _ = require('./../../../core/underscore.js');
var Predicate = require('./../../../core/predicates/predicates.js');
var GroupCriteria = require('./../../groups/domain/group-criteria.js');

module.exports = SingleServerCriteria;

function SingleServerCriteria(criteria) {
    var self = this;

    function filterById() {
        if (criteria.id) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    }

    function filterByName () {
        return criteria.name &&
            Predicate.equalToAnyOf(_.asArray(criteria.name), 'name') ||
            Predicate.alwaysTrue();
    }

    function filterByCustomPredicate () {
        return criteria.where && new Predicate(criteria.where) || Predicate.alwaysTrue();
    }

    function filterNameContains() {
        return Predicate.match(criteria.nameContains, "name");
    }

    function filterDescriptionContains() {
        return Predicate.match(criteria.descriptionContains, "description");
    }

    function filterByPowerState() {
        return criteria.powerStates && Predicate.equalToAnyOf(criteria.powerStates, "details.powerState") ||
            Predicate.alwaysTrue();
    }

    function filterActive() {
        return criteria.onlyActive && Predicate.equalTo("active", "status") ||
                Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            new GroupCriteria(criteria.group).predicate("group")
                .and(filterById())
                .and(filterByName())
                .and(filterByCustomPredicate())
                .and(filterNameContains())
                .and(filterDescriptionContains())
                .and(filterActive())
                .and(filterByPowerState()),
            path
        );
    };

    self.processGroupCriteria = function () {
        criteria = new GroupCriteria(criteria).processDataCenterCriteria();
        //instantiate object from properties
        var groupCriteria =
        {
            id: criteria.groupId ? _.asArray(criteria.groupId) : null,
            name: criteria.groupName ? _.asArray(criteria.groupName) : null,
            nameContains: criteria.groupNameContains ? _.asArray(criteria.groupNameContains) : null
        };

        criteria = _.omit(criteria, ['groupId', 'groupName', 'groupNameContains']);

        //transform criteria to Array
        var arrayCriteria = !criteria.group ? _.asArray(groupCriteria)
            : _.asArray(criteria.group, groupCriteria);

        _.each(arrayCriteria, function(groupCriteria) {
            groupCriteria.dataCenter = criteria.dataCenter;
        });

        criteria.group = {or: _.filter(arrayCriteria, function(criteria) {
            return !_.values(criteria).every(_.isNull);
        })};

        return criteria;
    };
}