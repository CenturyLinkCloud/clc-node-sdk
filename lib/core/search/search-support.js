
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

    self.findSingle = function (criteria) {
        return self.find(criteria).then(getOnlySingleResult);
    };

}