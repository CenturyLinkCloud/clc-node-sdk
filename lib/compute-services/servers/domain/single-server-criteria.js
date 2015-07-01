
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
            (criteria.group ? new GroupCriteria(criteria.group).predicate("group") : Predicate.alwaysTrue())
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

    self.parseGroupCriteria = function () {
        criteria = new GroupCriteria(criteria).parseDataCenterCriteria();
        //instantiate object from properties
        var groupCriteria =
        {
            id: criteria.groupId ? _.asArray(criteria.groupId) : null,
            name: criteria.groupName ? _.asArray(criteria.groupName) : null,
            nameContains: criteria.groupNameContains ? _.asArray(criteria.groupNameContains) : null
        };

        var parsedCriteria = _.omit(criteria, ['groupId', 'groupName', 'groupNameContains']);

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria.group ? _.asArray(groupCriteria)
            : _.asArray(parsedCriteria.group, groupCriteria);

        if (parsedCriteria.dataCenter) {
            _.each(arrayCriteria, function(groupCriteria) {
                groupCriteria.dataCenter = parsedCriteria.dataCenter;
            });
        }

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            parsedCriteria.group = {or: nonEmptyOperands};
        }

        return parsedCriteria;
    };
}