
module.exports = SearchSupport;

function SearchSupport () {
    var self = this;

    function getOnlySingleResult (result) {
        if (!result || result.length === 0) {
            throw new Error("Can't resolve any template");
        }

        if (result.length > 1) {
            throw new Error("Please specify more concrete search criteria");
        }

        return result[0];
    }

    function arrayToCompositeCriteria(array) {
        var emptyObject = { };

        return array
            .reduce(function (memo, item) {
                return { or: [memo, singleItemToCriteria(item)] };
            }, emptyObject);
    }

    function singleItemToCriteria(curItem) {
        if (curItem instanceof Object) {
            return curItem;
        } else if (curItem instanceof Array) {
            return arrayToCompositeCriteria(curItem);
        } else {
            throw new Error('Criteria[' + curItem + '] must be an object');
        }
    }

    self.findSingle = function (criteria) {
        return self.find(criteria).then(getOnlySingleResult);
    };

    self._toCriteriaObject = function (args) {
        var argsArray = Array.prototype.slice.call(args);

        if (argsArray.length > 1) {
            return arrayToCompositeCriteria(argsArray);
        } else if (argsArray.length === 1) {
            return singleItemToCriteria(argsArray[0]);
        } else {
            return { };
        }
    };

}