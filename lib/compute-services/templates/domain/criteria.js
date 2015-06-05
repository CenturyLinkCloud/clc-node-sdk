
var Predicate = require('./../../../core/predicates/predicates.js');

module.exports = TemplateCriteria;

/*
nakedCriteria =
{
    datacenter: compute.DataCenter.DE_FRANKFURT,
    os: compute.Os.CENTOS,
    version: "6",
    edition: "Some Edition",
    architecture: compute.Machine.Architecture.x86_64
}
 */
function TemplateCriteria (nakedCriteria) {
    var self = this;
    var predicate = {};

    function init () {
//        nakedCriteria.names &&
    }

    self.extractPredicateFromCriteria = function(criteria) {
        return resolveFilterCriteria(criteria);
    };

    function resolveFilterCriteria() {
        var criteria = nakedCriteria;
        var predicate = new Predicate(function(data) {
                var osType = data.osType.toUpperCase();

                if (criteria.os) {
                    if (osType.indexOf(criteria.os.toUpperCase()) === 0) {
                        osType = osType.replace(criteria.os.toUpperCase(), "");
                    } else {
                        return false;
                    }
                }

                if (criteria.architecture) {
                    if (osType.indexOf(criteria.architecture.toUpperCase()) > 0) {
                        osType = osType.replace(criteria.architecture.toUpperCase(), "");
                    } else {
                        return false;
                    }
                }

                if (criteria.version) {
                    if (osType.indexOf(criteria.version.toUpperCase()) === 0) {
                        osType = osType.replace(criteria.version.toUpperCase(), "");
                    } else {
                        return false;
                    }
                }

                if (criteria.edition) {
                    if (osType.startsWith(criteria.edition.toUpperCase())) {
                        osType = osType.replace(criteria.edition.toUpperCase(), "");
                    } else {
                        return false;
                    }
                }

                return true;
            });

        return predicate;
    }

    init ();
}