
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
                return { or: [memo, self._toCriteriaObject(item)] };
            }, emptyObject);
    }

    self.findSingle = function (criteria) {
        return self.find(criteria).then(getOnlySingleResult);
    };

    self._toCriteriaObject = function (args) {
        var argsArray = Array.prototype.slice.call(args);

        if (argsArray.length > 1) {
            console.log(argsArray);
            return arrayToCompositeCriteria(argsArray);
        } else if (argsArray.length === 1) {
            if (argsArray[0] instanceof Object) {
                return argsArray[0];
            } else {
                throw new Error('Criteria[' + argsArray[0] + '] must be an object');
            }
        } else {
            return { };
        }
    };

}