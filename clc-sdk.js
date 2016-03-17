/*! Version: 1.1.3 */
require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"clc-sdk":[function(require,module,exports){

var CommandLineCredentialsProvider = require('./core/auth/credentials-provider.js').CommandLineCredentialsProvider;
var EnvironmentCredentialsProvider = require('./core/auth/credentials-provider.js').EnvironmentCredentialsProvider;
var AuthenticatedClient = require('./core/client/authenticated-client.js');
var ComputeServices = require('./compute-services/compute-services.js');
var BaseServices = require('./base-services/base-services.js');
var _ = require('underscore');


module.exports = ClcSdk;

function ClcSdk () {
    var self = this;
    var username;
    var password;
    var clientOptions;

    function init (args) {
        clientOptions = getClientOptions(args);

        if (args.length >= 2 &&
                typeof(args[0]) === 'string' &&
                typeof(args[1]) === 'string') {
            initWithCredentials(args[0], args[1]);
            return;
        }

        if (args.length > 1 && args[0] instanceof Object) {
            initWithCredentialsProvider(args[0]);
            return;
        }

        initWithDefaultCredentialsProvider();
    }

    function initWithCredentials(usernameVal, passwordVal) {
        username = usernameVal;
        password = passwordVal;
    }

    function initWithCredentialsProvider(credentialsProvider) {
        username = credentialsProvider.getUsername();
        password = credentialsProvider.getPassword();
    }

    function initWithDefaultCredentialsProvider() {
        var provider = new CommandLineCredentialsProvider();

        username = provider.getUsername();
        password = provider.getPassword();

        if (!username && !password) {
            var environmentCredentials = new EnvironmentCredentialsProvider();

            username = environmentCredentials.getUsername();
            password = environmentCredentials.getPassword();
        }
    }

    function getClientOptions(args) {
        if (args.length === 0) {
            return {};
        }
        var options = _.last(args);

        if (options instanceof Object) {
            return {
                maxRetries: options.maxRetryCount,
                retryInterval: options.retryInterval
            };
        }
    }

    self.authenticatedClient = _.memoize(function () {
        return new AuthenticatedClient(
            username,
            password,
            clientOptions
        );
    });

    self.baseServices = _.memoize(function () {
        return new BaseServices(self.authenticatedClient);
    });

    self.computeServices = _.memoize(function () {
        return new ComputeServices(self.authenticatedClient, self.baseServices);
    });

    init (arguments);
}
},{"./base-services/base-services.js":2,"./compute-services/compute-services.js":27,"./core/auth/credentials-provider.js":84,"./core/client/authenticated-client.js":86,"underscore":"underscore"}],1:[function(require,module,exports){
var _ = require('underscore');

module.exports = AccountClient;

function AccountClient (rest) {
    var self = this;

    self.getCustomFields = _.memoize(function () {
        return rest.get('/v2/accounts/{ACCOUNT}/customFields');
    });
}
},{"underscore":"underscore"}],2:[function(require,module,exports){

var DataCenters = require('./datacenters/datacenters.js');
var QueueClient = require('./queue/queue-client.js');
var ExperimentalQueueClient = require('./queue/experimental-queue-client');
var DataCenterClient = require('./datacenters/datacenter-client.js');
var AccountClient = require('./account/account-client.js');
var _ = require('underscore');
var DataCenter = require('./datacenters/domain/datacenter.js');


module.exports = BaseServices;

function BaseServices (getRestClientFn) {
    var self = this;

    function init () {

    }

    var dataCenterClient = _.memoize(function () {
        return new DataCenterClient(getRestClientFn());
    });

    self._queueClient = _.memoize(function () {
        return new QueueClient(getRestClientFn());
    });

    self._experimentalQueueClient = _.memoize(function () {
        return new ExperimentalQueueClient(getRestClientFn());
    });

    self.dataCenters = _.memoize(function () {
        return new DataCenters(dataCenterClient());
    });

    self.accountClient = _.memoize(function () {
        return new AccountClient(getRestClientFn());
    });

    self.DataCenter = DataCenter;

    init ();
}
},{"./account/account-client.js":1,"./datacenters/datacenter-client.js":3,"./datacenters/datacenters.js":4,"./datacenters/domain/datacenter.js":7,"./queue/experimental-queue-client":14,"./queue/queue-client.js":15,"underscore":"underscore"}],3:[function(require,module,exports){

var _ = require('underscore');

module.exports = DataCenterClient;


function DataCenterClient (rest) {
    var self = this;

    self.findAllDataCenters = _.memoize(function () {
        return rest.get('/v2/datacenters/{ACCOUNT}?groupLinks=true');
    });

    self.getDeploymentCapabilities = function (dataCenterId) {
        return rest.get('/v2/datacenters/{ACCOUNT}/' + dataCenterId + '/deploymentCapabilities');
    };
}
},{"underscore":"underscore"}],4:[function(require,module,exports){
var _ = require('underscore');
var DataCenterCriteria = require('./domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');

var DataCenterMetadata = require('./domain/datacenter-metadata.js');

module.exports = DataCenters;


/**
 * Object provide access to datacenters functionality of CenturyLink Cloud
 *
 * @param {DataCenterClient} dataCenterClient
 * @constructor
 */
function DataCenters (dataCenterClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Method returns the list of capabilities that a specific data center supports
     *
     * @param {string} dataCenterId
     * @returns {Promise<DeploymentCapability>} Promise of the list of capabilities
     *
     * @memberof DataCenters
     * @instance
     * @function getDeploymentCapabilities
     */
    self.getDeploymentCapabilities = function(dataCenterId) {
        return dataCenterClient.getDeploymentCapabilities(dataCenterId);
    };

    /**
     * Method returns the list of DataCenters by DataCenterCriteria
     *
     * @param {DataCenterCriteria} arguments - set of datacenter criterias
     * @returns {Promise<Array<DataCenterMetadata>>}
     *
     * @memberof DataCenters
     * @instance
     * @function find
     */
    self.find = function () {
        var criteria = self._searchCriteriaFrom(arguments);

        return dataCenterClient
            .findAllDataCenters()
            .then(function (list) {
                return _.filter(list, new DataCenterCriteria(criteria).predicate().fn);
            })
            .then(_.partial(_.applyMixin, DataCenterMetadata));
    };

    init ();
}
},{"./../../core/search/search-support.js":96,"./domain/datacenter-criteria.js":5,"./domain/datacenter-metadata.js":6,"underscore":"underscore"}],5:[function(require,module,exports){

var SingleDataCenterCriteria = require('./single-datacenter-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = DataCenterCriteria;


/**
 * Class that used to filter data centers
 * @typedef DataCenterCriteria
 * @type {(SingleDataCenterCriteria|CompositeCriteria)}
 *
 */
function DataCenterCriteria(criteria) {
    return new SearchCriteria(criteria, SingleDataCenterCriteria);
}
},{"./../../../core/search/common-criteria.js":92,"./single-datacenter-criteria.js":8}],6:[function(require,module,exports){
var _ = require('underscore');

module.exports = DataCenterMetadata;

/**
 * The class that represents the data center metadata
 * @property {string} id - Short value representing the data center code.
 * @property {string} name - Full, friendly name of the data center.
 * @property {Array} links - Collection of entity links that point to resources related to this data center.
 * @constructor
 */
function DataCenterMetadata() {
    var self = this;

    /**
     * Get the root group ID (data center id + ' Hardware')
     * @returns {string} the root group ID
     * @memberof DataCenterMetadata
     * @instance
     * @function getGroupId
     */
    self.getGroupId = function() {
        return  _.findWhere(this.links, {rel: "group"}).id;
    };
}
},{"underscore":"underscore"}],7:[function(require,module,exports){
/**
 * @typedef DataCenterReference
 * @type {object}
 * @property {string} id - a data center ID.
 * @property {string} name - a data center name.
 */

/**
 * The DataCenter enum
 * @enum {DataCenterReference}
 */
var DataCenter = {

    DE_FRANKFURT: {
        id: 'de1',
        name: 'DE1 - Germany (Frankfurt)'
    },

    CA_VANCOUVER: {
        id: 'ca1',
        name: 'CA1 - Canada (Vancouver)'
    },

    CA_TORONTO_1: {
        id: 'ca2',
        name: 'CA2 - Canada (Toronto)'
    },

    CA_TORONTO_2: {
        id: 'ca3',
        name: 'CA3 - Canada (Toronto)'
    },

    GB_PORTSMOUTH: {
        id: 'gb1',
        name: 'GB1 - Great Britain (Portsmouth)'
    },

    GB_SLOUGH: {
        id: 'gb3',
        name: 'GB3 - Great Britain (Slough)'
    },

    US_CENTRAL_CHICAGO: {
        id: 'il1',
        name: 'IL1 - US Central (Chicago)'
    },

    US_EAST_NEW_YORK: {
        id: 'ny1',
        name: 'NY1 - US East (New York)'
    },

    SG_APAC: {
        id: 'sg1',
        name: 'SG1 - APAC (Singapore)'
    },

    US_WEST_SANTA_CLARA: {
        id: 'uc1',
        name: 'UC1 - US West (Santa Clara)'
    },

    US_CENTRAL_SALT_LAKE_CITY: {
        id: 'ut1',
        name: 'UT1 - US Central (Salt Lake City)'
    },

    US_EAST_STERLING: {
        id: 'va1',
        name: 'VA1 - US East (Sterling)'
    },

    US_WEST_SEATTLE: {
        id: 'wa1',
        name: 'WA1 - US West (Seattle)'
    }

};

module.exports = DataCenter;
},{}],8:[function(require,module,exports){

var Predicate = require('./../../../core/predicates/predicates.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleDataCenterCriteria;

/**
 * The type of {@link DataCenterCriteria} that represents single search criteria.
 * @typedef SingleDataCenterCriteria
 * @type {object}
 *
 * @property {string | Array<string>} id - a ID of target data center
 * @property {string | Array<string>} name - a name of target data center
 * @property {string | Array<string>} nameContains - search data centers which name contains specified keyword
 * @property {function} where - restriction that pass only data center which data match function logic.
 */
function SingleDataCenterCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byId()
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name')),

            path
        );
    };

    init();
}
},{"./../../../core/predicates/predicates.js":91,"./../../../core/search/criteria.js":94}],9:[function(require,module,exports){

var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CloudJob;

function CloudJob (queueClient, jobInfoData) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        jobInfo = _.extend(Object.create(new StatusResult()), jobInfoData);

    function init () {
        self = new Promise(saveResolveFn);
    }
    init ();

    function saveResolveFn(resolveFn, rejectFn) {
        resolve = resolveFn;
        reject = rejectFn;
    }

    function isJobFailed(status) {
        return !status || status === 'failed' || status === 'unknown';
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || 5000);
    }

    function makeJobFailedMessage(status) {
        return { status: status, job: jobInfo };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'succeeded') {
                resolve(jobInfo);
            } else {
                setTimeout(awaitFn(timeout), timeout || 0);
            }
        };
    }

    self.await = function (timeout) {
        if (jobInfo && jobInfo.isQueued === false) {
            reject(makeJobFailedMessage("notQueued"));
        } else {
            queueClient
                .getStatus(jobInfo.findStatusId())
                .then(_.property('status'))
                .then(onStatusReceived(timeout));
        }

        return self;
    };

    return self;
}

function StatusResult () {

    this.findStatusId = function () {
        return this.operationId || _.findWhere(this.links || [this], {rel: "status"}).id;
    };

}
},{"bluebird":"bluebird","underscore":"underscore"}],10:[function(require,module,exports){

var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreateLoadBalancerJob;

function CreateLoadBalancerJob (loadBalancerService, result) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        defaultTimeout = 5000;

    function init () {
        self = new Promise(saveResolveFn);
    }
    init ();

    function saveResolveFn(resolveFn, rejectFn) {
        resolve = resolveFn;
        reject = rejectFn;
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || defaultTimeout);
    }

    self.await = function (timeout) {
        loadBalancerService
            .findSingle(result)
            .then(resolve)
            .catch(function(err) {
                if (err.message && err.message.indexOf("any object") > -1) {
                    setTimeout(awaitFn(timeout), timeout || defaultTimeout);
                } else {
                    reject(err);
                }
            }
        );

        return self;
    };

    return self;
}
},{"bluebird":"bluebird","underscore":"underscore"}],11:[function(require,module,exports){

var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreateServerJob;

function CreateServerJob (serverClient, result) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        defaultTimeout = 5000;

    function init () {
        self = new Promise(saveResolveFn);
    }
    init ();

    function saveResolveFn(resolveFn, rejectFn) {
        resolve = resolveFn;
        reject = rejectFn;
    }

    function isJobFailed(status) {
        return !status || status === 'failed' || status === 'unknown';
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || defaultTimeout);
    }

    function makeJobFailedMessage(status) {
        return { status: status, job: result };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'active') {
                resolve(result);
            } else if (isJobFailed(status)) {
                reject(makeJobFailedMessage(status));
            } else {
                setTimeout(awaitFn(timeout), timeout || defaultTimeout);
            }
        };
    }

    self.await = function (timeout) {
        serverClient
            .findServerById(result.id)
            .then(_.property('status'))
            .then(onStatusReceived(timeout));

        return self;
    };

    return self;
}
},{"bluebird":"bluebird","underscore":"underscore"}],12:[function(require,module,exports){

var OperationPromise = require('./operation-promise.js');

module.exports = NoWaitOperationPromise;

function NoWaitOperationPromise(queueClient, onCompleteFn) {
    var self = new OperationPromise(queueClient, onCompleteFn);

    self.resolveWhenJobCompleted = function(response) {
        setTimeout(function () {
            self.emit('job-queue', response);
            self.processComplete(response);
        });

        return self;
    };

    return self;
}
},{"./operation-promise.js":13}],13:[function(require,module,exports){
var _ = require('underscore');
var Promise = require("bluebird");
var events = require('events');
var EventEmitter = events.EventEmitter;
var CloudJob = require('./cloud-job.js');

module.exports = OperationPromise;

function OperationPromise(queueClient, onCompleteFn, operationName) {
    var self,
        emitter = new EventEmitter(),
        emitterMethods = ['on', 'emit'];

    function init () {
        self = new Promise(function (resolve, reject) {
            emitter.on('complete', function (result) {
                if (self.jobs.length > 0) {
                    Promise.all(_.map(self.jobs, function(job) {
                        var jobResult = job(result);
                        //is job
                        if (jobResult.await) {
                            return jobResult.await();
                        }
                        return jobResult;
                    })).then(resolve);

                    delete self.jobs;
                } else {
                    resolve(result);
                }
            });

            emitter.on('error', function (errors) {
                reject(errors);
            });
        });

        _.each(emitterMethods, function(method) {
            self[method] = _.bind(emitter[method], emitter);
        });

        if (typeof onCompleteFn === "string") {
            operationName = onCompleteFn;
            onCompleteFn = undefined;
        }

        self.jobs = [];
    }

    init ();

    function awaitCloudJob (curJobInfo) {
        return new CloudJob(queueClient, curJobInfo).await();
    }

    self.addJobFn = function(job) {
        self.jobs.push(job);

        return self;
    };

    self.from = function (promise) {
        promise.then(self.resolveWhenJobCompleted, self.processErrors);
        return self;
    };

    self.fromInspections = function (promise) {
        promise.then(resolvePromiseInspections);
        return self;
    };

    function resolvePromiseInspections(results) {

        var allPromiseInspections = _.partition(results, function(result) {
            return result.isFulfilled();
        });

        var errors = _.chain(allPromiseInspections[1])
            .map(function(inspection) {
                return inspection.error();
            })
            .value();

        if (errors.length > 0) {
            self.processErrors(errors);
        } else {
            var jobInfo = _.chain(allPromiseInspections[0])
                .map(function(inspection) {
                    return inspection.value();
                })
                .value();

            self.resolveWhenJobCompleted(jobInfo);
        }

    }

    self.resolveWhenJobCompleted = function(jobInfo) {
        self.emit('job-queue', jobInfo);

        if (jobInfo instanceof Array) {
            Promise
                .all(jobInfo.map(awaitCloudJob))
                .then(self.processComplete, self.processErrors);
        } else {
            awaitCloudJob(jobInfo)
                .then(self.processComplete, self.processErrors);
        }

        return self;
    };

    function logErrors(response) {
        console.error("The operation " + (operationName ? ("*" + operationName + "* ") : "") + "was failed:");
        _.each(_.asArray(response), processError);
    }

    self.processErrors = function(response) {
        logErrors(response);

        var processedErrors = _.chain(response)
            .asArray()
            .each(function(err) {
                err.operationName = operationName;
            })
            .value();

        self.emit('error', processedErrors);
    };

    function processError(response) {
        var details;
        if (response.data) {
            details = response.data;
        }
        if (response.job) {
            details = response.job;
        }

        var errorMessage = "The request was failed " + response +
            (details ? ". Details: " + JSON.stringify(details) : "");

        console.error(errorMessage);
    }

    self.processComplete = function (response) {
        if (onCompleteFn) {
            Promise.resolve(onCompleteFn(response)).then(function (result) {
                emitter.emit('complete', result);
            });
        } else {
            emitter.emit('complete', response);
        }
    };

    return self;
}
},{"./cloud-job.js":9,"bluebird":"bluebird","events":"events","underscore":"underscore"}],14:[function(require,module,exports){

module.exports = ExperimentalQueueClient;


function ExperimentalQueueClient(rest) {
    var self = this;

    self.getStatus = function (statusId) {
        return rest.get('/v2-experimental/operations/{ACCOUNT}/status/' + statusId);
    };
}


},{}],15:[function(require,module,exports){

module.exports = QueueClient;


function QueueClient (rest) {
    var self = this;

    self.getStatus = function (statusId) {
        return rest.get('/v2/operations/{ACCOUNT}/status/' + statusId);
    };
}
},{}],16:[function(require,module,exports){

var SingleCriteria = require('./single-balancer-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = SharedLoadBalancerCriteria;

/**
 * Class that used to filter shared load balancers
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeCriteria)}
 *
 */
function SharedLoadBalancerCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-balancer-criteria.js":17}],17:[function(require,module,exports){

var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleSharedLoadBalancerCriteria;


/**
 * The type of {@link SharedLoadBalancerCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleSharedLoadBalancerCriteria
 * @type {object}
 *
 * @property {string} id - a balancer id restriction.
 * @property {string} name - a balancer name restriction.
 * @property {string} ip - a balancer ip address restriction.
 * @property {string} status - a balancer status restriction.
 * @property {string} nameContains - restriction that pass only balancer which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only balancer which description contains specified keyword.
 * @property {function} where - restriction that pass only balancer which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only balancer which data center name contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example load balancer criteria
 * {
 *     name: ['My balancer'],
 *     descriptionContains: "blah",
 *     ip: ['66.155.94.19'],
 *     status: 'enabled',
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.name === 'Balancer';
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleSharedLoadBalancerCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byParamMatch('descriptionContains', 'description'))
            .and(filters.byParamAnyOf('ip', 'ipAddress'))
            .and(filters.byParamAnyOf('status')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}
},{"./../../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94}],18:[function(require,module,exports){
var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var SharedLoadBalancerCriteria = require('./domain/balancer-criteria');
var Criteria = require('./../../../core/search/criteria.js');
var CreateLoadBalancerJob = require('./../../../base-services/queue/domain/create-load-balancer-job');

module.exports = SharedLoadBalancers;

/**
 * @typedef SharedLoadBalancerGroupMetadata
 * @type {object}
 * @property {String} id - ID of the load balancer
 * @property {String} name - Friendly name of the load balancer
 * @property {String} description - Description for the load balancer
 * @property {String} ipAddress - The external (public) IP address of the load balancer
 * @property {String} status - Status of the load balancer: enabled, disabled or deleted
 * @property {Array<SharedLoadBalancerPoolMetadata>} pools - Collection of pools configured for this shared load balancer
 * @property {Array} links - Collection of entity links that point to resources related to this load balancer
 *
 * @example
 * {
 *   "id" : "ae3bbac5d9694c70ad7de062476ccb70",
 *   "name" : "My Load Balancer",
 *   "description" : "My Load Balancer",
 *   "ipAddress" : "12.34.56.78",
 *   "status" : "disabled",
 *   "pools" : [
 *     {
 *       "id" : "2fa937bd20dd47c9b856376e9499c0c1",
 *       "port" : 80,
 *       "method" : "roundRobin",
 *       "persistence" : "standard",
 *       "nodes" : [
 *         {
 *           "status" : "enabled",
 *           "ipAddress" : "10.11.12.13",
 *           "privatePort" : 80,
 *           "name" : "10.11.12.13"
 *         },
 *         {
 *           "status" : "enabled",
 *           "ipAddress" : "10.11.12.14",
 *           "privatePort" : 80,
 *           "name" : "10.11.12.14"
 *         }
 *       ],
 *       "links" : [...]
 *     }
 *   ],
 *   "links" : [...]
 * }
 */

/**
 * Service that allow to manage shared load balancers groups in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancers(dataCenterService, loadBalancerClient, queueClient) {
    var self = this;

    var Status = {
        ENABLED: "enabled",
        DISABLED: "disabled"
    };

    function init () {
        SearchSupport.call(self);
    }

    self._poolService = function(poolService) {
        self.pools = poolService;
    };

    /**
     * Method allow to create shared load balancer
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - search criteria that specify one single target data center
     * @param {string} command.name - target balancer name
     * @param {string} command.description - target balancer description
     * @param {CreatePoolConfig} command.pool - if specified, creates pools
     *
     * @instance
     * @function create
     * @memberof SharedLoadBalancers
     */
    self.create = function(command) {
        var result = dataCenterService.findSingle(command.dataCenter)
            .then(function(dataCenter) {
                command = setBalancerStatus(command);
                return loadBalancerClient.createLoadBalancer(dataCenter.id, _.omit(command, "dataCenter", "pool"))
                    .then(function(result) {
                        result.dataCenter = dataCenter;
                        return new CreateLoadBalancerJob(self, result).await();
                    });
            })
            .then(_.partial(addPools, command));

        return new NoWaitOperationPromise(queueClient, processedBalancerRef, "Create Shared Load Balancer")
            .from(result);
    };

    function addPools(command, balancer) {
        if (command.pool) {
            return Promise.all(_.map(_.asArray(command.pool), function(poolConfig) {
                poolConfig.balancer = processedBalancerRef(balancer);
                return self.pools().create(poolConfig);
            }))
            .then(_.partial(Promise.resolve, balancer));
        }

        return Promise.resolve(balancer);
    }

    function processedBalancerRef(response) {
        return { id: response.id, dataCenter: response.dataCenter };
    }

    function processedBalancerRefs(balancers) {
        return _.map(balancers, processedBalancerRef);
    }

    function deleteBalancer(metadata) {
        return loadBalancerClient
            .deleteLoadBalancer(metadata.id, metadata.dataCenter.id)
            .then(_.partial(processedBalancerRef, metadata));
    }

    /**
     * Method allow to delete shared load balancers
     * @param {SharedLoadBalancerCriteria} arguments - criteria that specify set of balancers that will be removed
     *
     * @returns {OperationPromise}
     *
     * @instance
     * @function delete
     * @memberof SharedLoadBalancers
     */
    self.delete = function () {

        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (balancers) {
                return Promise.settle(_.map(balancers, deleteBalancer));
            });

        return new NoWaitOperationPromise(queueClient, processedBalancerRefs, "Delete Shared Load Balancer")
            .fromInspections(result);
    };

    function modifySingle(modificationConfig, balancer) {
        if (modificationConfig.name === undefined) {
            modificationConfig.name = balancer.name;
        }

        if (modificationConfig.description === undefined) {
            modificationConfig.description = balancer.description;
        }

        return loadBalancerClient.modifyLoadBalancer(
                balancer.id, balancer.dataCenter.id, _.omit(modificationConfig, "pool")
            )
            .then(_.partial(modifyPools, modificationConfig, balancer))
            .then(_.partial(Promise.resolve, balancer));
    }

    function modifyPools(modificationConfig, balancer) {
        if (modificationConfig.pool) {
            return Promise.all(
                _.map(_.asArray(modificationConfig.pool), _.partial(tryToUpdatePool, balancer))
            );
        }
        return Promise.resolve(balancer);
    }

    function modifyPool(poolCriteria, poolConfig) {
        return self.pools().modify(poolCriteria, poolConfig);
    }

    function createPool(poolConfig, balancer) {
        return self.pools().create(
            _.extend(
                poolConfig,
                {
                    balancer: {
                        id: balancer.id, dataCenter: balancer.dataCenter
                    }
                }
            )
        );
    }

    function loadPools(poolCriteria) {
        return self.pools().find(poolCriteria);
    }

    function tryToUpdatePool(balancer, poolConfig) {
        if (poolConfig.id) {
            return modifyPool({id: poolConfig.id, balancer: processedBalancerRef(balancer)}, _.omit(poolConfig, 'id'));
        } else {
            return loadPools({balancer: processedBalancerRef(balancer)})
                .then(function(pools) {
                    var pool = _.findWhere(pools, {port: poolConfig.port});
                    if (pool) {
                        return modifyPool({id: pool.id, balancer: processedBalancerRef(balancer)}, poolConfig);
                    } else {
                        return createPool(poolConfig, processedBalancerRef(balancer));
                    }
                });
        }
    }

    function setBalancerStatus(config) {
        if (config.enabled === true) {
            config.status = Status.ENABLED;
        } else if (config.enabled === false) {
            config.status = Status.DISABLED;
        }

        return _.omit(config, "enabled");
    }

    /**
     * Method allow to modify shared load balancer resource settings
     *
     * @param {SharedLoadBalancerCriteria} balancerCriteria -
     * criteria that specify set of balancers that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new balancer name
     * @param {string} modificationConfig.description - new value of balancer description
     * @param {boolean} modificationConfig.enabled - the new status of balancer
     * @param {CreatePoolConfig} modificationConfig.pool - if specified, updates pools
     * @return {Promise<SharedLoadBalancerCriteria[]>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancers
     */
    self.modify = function (balancerCriteria, modificationConfig) {
        var criteria = initCriteria(balancerCriteria);

        modificationConfig = setBalancerStatus(modificationConfig);

        var result = self.find(criteria)
            .then(function(balancers) {
                return Promise.settle(_.map(balancers, _.partial(modifySingle, modificationConfig)));
            });

        return new NoWaitOperationPromise(queueClient, processedBalancerRefs, "Update Shared Load Balancer")
            .fromInspections(result);
    };

    /**
     * Method allows to search shared load balancers.
     *
     * @param {SharedLoadBalancerCriteria} arguments - criteria that specify set of balancers that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerCriteria>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancers
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadBalancersByDataCenter)
            .then(setDataCenterToBalancers)
            .then(_.partial(filterBalancers, _, criteria));
    };

    function loadBalancersByDataCenter(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return Promise.props(
                    {
                        dataCenter: dataCenter,
                        balancers: loadBalancerClient.findLoadBalancers(dataCenter.id)
                    }
                );
            })
        );
    }

    function setDataCenterToBalancers(props) {
        return _.chain(props)
            .map(function(prop) {
                _.each(prop.balancers, function(balancer) {
                    balancer.dataCenter = prop.dataCenter;
                });

                return prop.balancers;
            })
            .flatten()
            .value();
    }

    function filterBalancers(balancers, criteria) {
        if (!balancers || balancers.length === 0) {
            return [];
        }
        return _.filter(balancers, new SharedLoadBalancerCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new SharedLoadBalancerCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}
},{"./../../../base-services/queue/domain/create-load-balancer-job":10,"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/criteria.js":94,"./../../../core/search/search-support.js":96,"./domain/balancer-criteria":16,"bluebird":"bluebird","underscore":"underscore"}],19:[function(require,module,exports){

var _ = require('underscore');
var util = require('util');

module.exports = LoadBalancerClient;

function LoadBalancerClient(rest) {
    var self = this;

    self.createLoadBalancer = function (dataCenterId, createRequest) {
        return rest.postJson(generateBalancerUrl(dataCenterId), createRequest);
    };

    self.deleteLoadBalancer = function (balancerId, dataCenterId) {
        return rest.delete(generateBalancerUrl(dataCenterId, balancerId));
    };

    self.findLoadBalancerById = function (balancerId, dataCenterId) {
        return rest.get(generateBalancerUrl(dataCenterId, balancerId));
    };

    self.findLoadBalancers = function (dataCenterId) {
        return rest.get(generateBalancerUrl(dataCenterId));
    };

    self.modifyLoadBalancer = function (balancerId, dataCenterId, updateRequest) {
        return rest.putJson(generateBalancerUrl(dataCenterId, balancerId), updateRequest);
    };

    function generateBalancerUrl(dataCenterId, balancerId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s%s',
            dataCenterId,
            balancerId ? ('/' + balancerId) : ""
        );
    }


    self.createLoadBalancerPool = function (dataCenterId, balancerId, createRequest) {
        return rest.postJson(generatePoolUrl(dataCenterId, balancerId),
            createRequest);
    };

    self.deleteLoadBalancerPool = function (poolId, dataCenterId, balancerId) {
        return rest.delete(generatePoolUrl(dataCenterId, balancerId, poolId));
    };

    self.findLoadBalancerPoolById = function (poolId, dataCenterId, balancerId) {
        return rest.get(generatePoolUrl(dataCenterId, balancerId, poolId));
    };

    self.findLoadBalancerPools = function (dataCenterId, balancerId) {
        return rest.get(generatePoolUrl(dataCenterId, balancerId));
    };

    self.modifyLoadBalancerPool = function (poolId, dataCenterId, balancerId, updateRequest) {
        return rest.putJson(generatePoolUrl(dataCenterId, balancerId, poolId), updateRequest);
    };

    function generatePoolUrl(dataCenterId, balancerId, poolId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s/%s/pools%s',
            dataCenterId,
            balancerId,
            poolId ? '/' + poolId : ""
        );
    }


    self.findLoadBalancerNodes = function (poolId, balancerId, dataCenterId) {
        return rest.get(generateNodesUrl(poolId, balancerId, dataCenterId));
    };

    self.modifyLoadBalancerNodes = function (poolId, balancerId, dataCenterId, updateRequest) {
        return rest.putJson(generateNodesUrl(poolId, balancerId, dataCenterId), updateRequest);
    };

    function generateNodesUrl(poolId, balancerId, dataCenterId) {
        return util.format('/v2/sharedLoadBalancers/{ACCOUNT}/%s/%s/pools/%s/nodes',
            dataCenterId,
            balancerId,
            poolId
        );
    }
}

},{"underscore":"underscore","util":"util"}],20:[function(require,module,exports){
var _ = require('underscore');
var GroupBalancers = require('./groups/load-balancer-groups.js');
var PoolBalancers = require('./pools/load-balancer-pools.js');
var NodeBalancers = require('./nodes/load-balancer-nodes.js');

module.exports = SharedLoadBalancers;

/**
 * Service that allow to manage load balancers in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancers(dataCenterService, loadBalancerClient, queueClient) {
    var self = this;

    self.groups = _.memoize(function() {
        return new GroupBalancers(dataCenterService, loadBalancerClient, queueClient);
    });

    self.pools = _.memoize(function() {
        return new PoolBalancers(self.groups(), loadBalancerClient, queueClient);
    });

    self.nodes = _.memoize(function() {
        return new NodeBalancers(self.pools(), loadBalancerClient, queueClient);
    });

    self.groups()._poolService(self.pools);
    self.pools()._nodeService(self.nodes);
}
},{"./groups/load-balancer-groups.js":18,"./nodes/load-balancer-nodes.js":23,"./pools/load-balancer-pools.js":26,"underscore":"underscore"}],21:[function(require,module,exports){

var SingleCriteria = require('./single-node-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = LoadBalancerNodeCriteria;

/**
 * Class that used to filter load balancer nodes
 * @typedef LoadBalancerNodeCriteria
 * @type {(SingleLoadBalancerNodeCriteria|CompositeCriteria)}
 *
 */
function LoadBalancerNodeCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-node-criteria.js":22}],22:[function(require,module,exports){

var Predicate = require('./../../../../core/predicates/predicates.js');
var PoolCriteria = require('./../../pools/domain/pool-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleLoadBalancerNodeCriteria;


/**
 * The type of {@link LoadBalancerNodeCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>pool</b> search criteria and the properties
 * <b>poolId, poolMethod, poolPersistence, poolPort</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {string} status - a node status restriction.
 * @property {number} ipAddress - a node ip address restriction.
 * @property {string} privatePort - a node private port restriction.
 * @property {LoadBalancerPoolCriteria} pool - restrict load balancer pools in which need to execute search.
 *
 * @property {string} poolId - a pool id restriction.
 * @property {string} poolMethod - a pool method restriction.
 * @property {string} poolPersistence - a pool persistence restriction.
 * @property {string} poolPort - a pool port number restriction.
 *
 * @example node criteria
 * {
 *   status: ['enabled', 'disabled', 'deleted'],
 *   ipAddress: '66.1.25.52',
 *   privatePort: [45, 8080],
 *   poolMethod: 'roundRobin'
 * }
 */
function SingleLoadBalancerNodeCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'pool';

        self.criteriaPropertiesMap = {
            id: 'poolId',
            method: 'poolMethod',
            persistence: 'poolPersistence',
            port: 'poolPort'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(PoolCriteria, 'pool')
                .and(filters.byParamAnyOf('status'))
                .and(filters.byParamAnyOf('privatePort'))
                .and(filters.byParamAnyOf('ipAddress')),
            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}
},{"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94,"./../../pools/domain/pool-criteria.js":24}],23:[function(require,module,exports){
var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var LoadBalancerNodeCriteria = require('./domain/node-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SharedLoadBalancerNodes;
/**
 * @typedef SharedLoadBalancerNodeMetadata
 * @type {object}
 * @property {String} status - Status of the node: enabled, disabled or deleted.
 * @property {String} ipAddress - The internal (private) IP address of the node server
 * @property {int} privatePort - The internal (private) port of the node server
 *
 * @example
 * {
 *    "status" : "enabled",
 *    "ipAddress" : "10.11.12.13",
 *    "privatePort" : 80
 *  }
 */

/**
 * @typedef CreateNodeConfig
 * @type {object}
 *
 * @property {string} status - Status of the node: enabled, disabled or deleted.
 * @property {string} ipAddress - The internal (private) IP address of the node server
 * @property {number} privatePort - The internal (private) port of the node server.
 * Must be a value between 1 and 65535.
 */

/**
 * Service that allow to manage load balancer nodes in CenturyLink Cloud
 *
 * @param loadBalancerPools
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancerNodes(loadBalancerPools, loadBalancerClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);

        self.Status = {
            ENABLED: "enabled",
            DISABLED: "disabled",
            DELETED: "deleted"
        };
    }

    function loadAllNodesWithPool(pool) {
        return Promise.props({
            pool: Promise.resolve(pool),
            nodes: loadBalancerClient.findLoadBalancerNodes(pool.id, pool.balancer.id, pool.balancer.dataCenter.id)
                .then(function(nodes) {
                    _.each(nodes, function(node) {
                        node.pool = pool;
                    });

                    return nodes;
                })
        });
    }

    /**
     * Method allow to create load balancer nodes
     *
     * @param {object} command
     * @param {LoadBalancerPoolCriteria} command.pool - the search criteria
     * that specifies one single target load balancer pool
     * @param {Array<CreateNodeConfig>} command.nodes - the list with nodes config
     *
     * @returns {Promise<Array<SharedLoadBalancerNodeMetadata>>} the array of created nodes
     *
     * @instance
     * @function create
     * @memberof SharedLoadBalancerNodes
     */
    self.create = function(command) {
        var result = loadBalancerPools.findSingle(command.pool)
            .then(loadAllNodesWithPool)
            .then(function(enhancedPool) {
                return modifyNodesForPool(
                    enhancedPool.pool,
                    _.asArray(enhancedPool.nodes, command.nodes),
                    command.nodes
                );
            });

        return new NoWaitOperationPromise(queueClient, "Create Load Balancer Node").from(result);
    };

    function findPools(criteria) {
         var poolCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.pool;
        });

        return loadBalancerPools.find(poolCriteria)
            .then(function(pools) {
                return Promise.all(_.map(pools, loadAllNodesWithPool));
            });
    }

    function deletePools(criteria, enhancedPool) {
        var pool = enhancedPool.pool;
        var nodes = enhancedPool.nodes;

        var nodesToDelete = filterNodes(nodes, criteria);

        if (nodesToDelete.length === 0) {
            return Promise.resolve(nodes);
        }

        var nodesLeft = _.filter(nodes, function(node) {
            return nodesToDelete.indexOf(node) === -1;
        });

        return modifyNodesForPool(pool, _.asArray(nodesLeft), nodesToDelete);
    }

    /**
    * Method allow to delete load balancer nodes
    * @param {LoadBalancerNodeCriteria} arguments - criteria that specify set of pool nodes that will be removed
    *
    * @returns {Promise<Array<SharedLoadBalancerNodeMetadata>>} the array of deleted nodes
    *
    * @instance
    * @function delete
    * @memberof SharedLoadBalancerNodes
    */
    self.delete = function () {
        var criteria = initCriteria(arguments);

        var result = findPools(criteria)
            .then(function(enhancedPools) {
                return Promise.settle(_.map(enhancedPools, _.partial(deletePools, criteria)));
            });

        return new NoWaitOperationPromise(queueClient, _.flatten, "Delete Load Balancer Node").fromInspections(result);
    };

    function modifyNodesForPool(pool, nodesToProcess, nodesToReturn) {
        nodesToProcess = _.map(nodesToProcess, function(node) {
            return _.omit(node, 'pool');
        });

        return loadBalancerClient
            .modifyLoadBalancerNodes(pool.id, pool.balancer.id, pool.balancer.dataCenter.id, nodesToProcess)
            .then(function() {
                _.each(nodesToReturn, function(node) {
                    node.pool = pool;
                });
                return nodesToReturn;
            });
    }

    function modifyNodes(enhancedPool, criteria, modificationConfig) {
        var pool = enhancedPool.pool;
        var nodes = enhancedPool.nodes;

        var nodesToUpdate = filterNodes(nodes, criteria);

        if (nodesToUpdate.length === 0) {
            return Promise.resolve(nodes);
        }

        var nodesWithoutUpdate = _.filter(nodes, function(node) {
            return nodesToUpdate.indexOf(node) === -1;
        });

        _.each(nodesToUpdate, function(node) {
            if (modificationConfig.ipAddress) {
                node.ipAddress = modificationConfig.ipAddress;
            }
            if (modificationConfig.privatePort) {
                node.privatePort = modificationConfig.privatePort;
            }
            if (modificationConfig.status) {
                node.status = modificationConfig.status;
            }
        });

        return modifyNodesForPool(pool, _.asArray(nodesWithoutUpdate, nodesToUpdate), nodesToUpdate);
    }

    /**
     * Method allow to modify load balancer nodes
     *
     * @param {LoadBalancerNodeCriteria} nodeCriteria - criteria that specify set of nodes that will be modified
     *
     * @param {CreateNodeConfig} modificationConfig - update config
     *
     * @return {Promise<Array<SharedLoadBalancerNodeMetadata>>} - promise that resolved by list of nodes.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancerNodes
     */
    self.modify = function (nodeCriteria, modificationConfig) {
        var criteria = initCriteria(nodeCriteria);

        var result = findPools(criteria)
            .then(function(enhancedPools) {
                return Promise.settle(
                    _.map(
                        enhancedPools,
                        function(enhancedPool) {
                            if (modificationConfig instanceof Array) {
                                return modifyNodesForPool(enhancedPool.pool, modificationConfig, modificationConfig);
                            }
                            return modifyNodes(enhancedPool, criteria, modificationConfig);
                        }
                    )
                );
            });

        return new NoWaitOperationPromise(queueClient, "Update Load Balancer Node").fromInspections(result);
    };

    /**
     * Method allows to search load balancer nodes.
     *
     * @param {LoadBalancerNodeCriteria} arguments - criteria that specify set of balancer pools that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerNodeMetadata>>} - promise that resolved by list of nodes.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancerNodes
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        return findPools(criteria)
            .then(_.partial(_.pluck, _, 'nodes'))
            .then(_.flatten)
            .then(_.partial(filterNodes, _, criteria));
    };

    function filterNodes(nodes, criteria) {
        if (!nodes || nodes.length === 0) {
            return [];
        }
        return _.filter(nodes, new LoadBalancerNodeCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new LoadBalancerNodeCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}
},{"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/criteria.js":94,"./../../../core/search/search-support.js":96,"./domain/node-criteria.js":21,"bluebird":"bluebird","underscore":"underscore"}],24:[function(require,module,exports){

var SingleCriteria = require('./single-pool-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = LoadBalancerPoolCriteria;

/**
 * Class that used to filter load balancer pools
 * @typedef LoadBalancerPoolCriteria
 * @type {(SingleLoadBalancerPoolCriteria|CompositeCriteria)}
 *
 */
function LoadBalancerPoolCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-pool-criteria.js":25}],25:[function(require,module,exports){

var Predicate = require('./../../../../core/predicates/predicates.js');
var BalancerCriteria = require('./../../groups/domain/balancer-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleLoadBalancerPoolCriteria;


/**
 * The type of {@link LoadBalancerNodeCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>balancer</b> search criteria and the properties
 * <b>balancerId, balancerName, balancerNameContains, balancerDescription, balancerDescriptionContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleLoadBalancerNodeCriteria
 * @type {object}
 *
 * @property {string} id - a pool id restriction.
 * @property {number} port - a pool port restriction.
 * @property {string} method - restriction that pass only pool which method equals specified keyword.
 * @property {string} persistence - restriction that pass only pool which persistence equals specified keyword.
 * @property {function} where - restriction that pass only pool which data match function logic.
 * @property {SharedLoadBalancerCriteria} balancer - restrict shared load balancers in which need to execute search.
 *
 * @property {string} balancerId - a shared load balancer id restriction.
 * @property {string} balancerName - a shared load balancer name restriction.
 * @property {string} balancerNameContains - restriction that pass only pool,
 * which shared load balancer name contains specified keyword.
 * @property {string} balancerDescription - a shared load balancer description restriction.
 * @property {string} balancerDescriptionContains - restriction that pass only pool,
 * which shared load balancer description contains specified keyword.
 *
 * @example shared load balancer criteria
 * {
 *     name: ['My balancer'],
 *     descriptionContains: "blah",
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.name === 'Balancer';
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 *
 * @example pool criteria
 * {
 *     port: [80, 443],
 *     method: "leastConnection",
 *     persistence: "sticky",
 *     where: function(metadata) {
 *          return metadata.nodes.length === 2;
 *     },
 *     balancerNameContains: 'Balancer'
 * }
 */
function SingleLoadBalancerPoolCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'balancer';

        self.criteriaPropertiesMap = {
            id: 'balancerId',
            name: 'balancerName',
            nameContains: 'balancerNameContains',
            description: 'balancerDescription',
            descriptionContains: 'balancerDescriptionContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(BalancerCriteria, 'balancer')
            .and(filters.byId())
            .and(filters.byParamAnyOf('method'))
            .and(filters.byParamAnyOf('port'))
            .and(filters.byParamAnyOf('persistence')),

            path
        );
    };

    self.parseCriteria = function () {
        return new Criteria(criteria).parseSingleCriteria(self);
    };

    init();
}
},{"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94,"./../../groups/domain/balancer-criteria.js":16}],26:[function(require,module,exports){
var _ = require('underscore');
var Promise = require('bluebird');

var SearchSupport = require('./../../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var LoadBalancerPoolCriteria = require('./domain/pool-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SharedLoadBalancerPools;


/**
 * @typedef SharedLoadBalancerPoolMetadata
 * @type {object}
 * @property {String} id - ID of the load balancer pool
 * @property {int} port - Port configured on the public-facing side of the load balancer pool.
 * @property {String} method - The balancing method for this load balancer, either leastConnection or roundRobin.
 * @property {String} persistence - The persistence method for this load balancer, either standard or sticky.
 * @property {Array<SharedLoadBalancerNodeMetadata>} nodes - Collection of nodes configured behind this shared load balancer
 * @property {Array} links - Collection of entity links that point to resources related to this load balancer pool
 *
 * @example
 * {
 *   "id" : "2fa937bd20dd47c9b856376e9499c0c1",
 *   "port" : 80,
 *   "method" : "roundRobin",
 *   "persistence" : "standard",
 *   "nodes" : [
 *     {
 *       "status" : "enabled",
 *       "ipAddress" : "10.11.12.13",
 *       "privatePort" : 80,
 *       "name" : "10.11.12.13"
 *     },
 *     {
 *       "status" : "enabled",
 *       "ipAddress" : "10.11.12.14",
 *       "privatePort" : 80,
 *       "name" : "10.11.12.14"
 *     }
 *   ],
 *   "links" : [
 *     {
 *       "rel" : "self",
 *       "href" : "/v2/sharedLoadBalancers/ALIAS/WA1/ae3bbac5d9694c70ad7de062476ccb70/pools/2fa937bd20dd47c9b856376e9499c0c1",
 *       "verbs" : [
 *         "GET",
 *         "PUT",
 *         "DELETE"
 *       ]
    },
 *     {
 *       "rel" : "nodes",
 *       "href" : "/v2/sharedLoadBalancers/ALIAS/WA1/ae3bbac5d9694c70ad7de062476ccb70/pools/2fa937bd20dd47c9b856376e9499c0c1/nodes",
 *       "verbs" : [
 *         "GET",
 *         "PUT"
 *       ]
 *     }
 *   ]
 * }
 */

/**
 * @typedef CreatePoolConfig
 * @type {object}

 * @param {SharedLoadBalancerCriteria} balancer - the search criteria
 * that specify one single target shared load balancer
 * @param {number} port - Port to configure on the public-facing side of the load balancer pool.
 * Must be either 80 (HTTP) or 443 (HTTPS).
 * @param {string} method - The balancing method for this load balancer,
 * either leastConnection or roundRobin. Default is roundRobin.
 * @param {string} persistence - The persistence method for this load balancer, either standard or sticky.
 * Default is standard.
 * @param {CreateNodeConfig} nodes - if specified, creates a set of nodes for pool
 */

/**
 * @typedef ModifyPoolConfig
 * @type {object}
 *
 * @param {object} modificationConfig
 * @param {string} modificationConfig.method - The balancing method for this load balancer,
 * either leastConnection or roundRobin. Default is roundRobin.
 * @param {string} modificationConfig.persistence - The persistence method for this load balancer,
 * either standard or sticky. Default is standard.
 * @param {CreateNodeConfig} modificationConfig.nodes - if specified, creates a set of nodes for pool
 */


/**
 * Service that allow to manage load balancer pools in CenturyLink Cloud
 *
 * @param loadBalancerGroups
 * @param loadBalancerClient
 * @param queueClient
 * @constructor
 */
function SharedLoadBalancerPools(loadBalancerGroups, loadBalancerClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    self._nodeService = function(nodeService) {
        self.nodes = nodeService;
    };

    self.Method = {
        LEAST_CONNECTION: "leastConnection",
        ROUND_ROBIN: "roundRobin"
    };

    self.Persistence = {
        STANDARD: "standard",
        STICKY: "sticky"
    };

    /**
     * Method allow to create load balancer pool
     * @param {CreatePoolConfig} command
     *
     * @returns {Promise<Reference>} the array of created pool reference
     * @instance
     * @function create
     * @memberof SharedLoadBalancerPools
     */
    self.create = function(command) {
        var result = loadBalancerGroups.findSingle(command.balancer)
            .then(function(balancer) {
                return loadBalancerClient.createLoadBalancerPool(
                    balancer.dataCenter.id, balancer.id, _.omit(command, "balancer", "nodes")
                );
            })
            .then(_.partial(addNodes, command));

        return new NoWaitOperationPromise(queueClient, processedPoolRef, "Create Load Balancer Pool").from(result);
    };

    function addNodes(command, pool) {
        if (command.nodes) {
            return self.nodes().create({pool: pool, nodes: command.nodes})
                .then(_.partial(Promise.resolve, pool));
        }

        return Promise.resolve(pool);
    }

    function deletePool(metadata) {
        return loadBalancerClient
            .deleteLoadBalancerPool(metadata.id, metadata.balancer.dataCenter.id, metadata.balancer.id)
            .then(function () {
                return {id: metadata.id};
            });
    }

    function processedPoolRef(response) {
        return { id: response.id, balancer: response.balancer };
    }

    function processedPoolRefs(balancers) {
        return _.map(balancers, processedPoolRef);
    }

    /**
     * Method allow to delete load balancer pools
     * @param {LoadBalancerPoolCriteria} arguments - criteria that specify set of balancer pools that will be removed
     *
     * @returns {Promise<Array<Reference>>} the array of deleted pools references
     *
     * @instance
     * @function delete
     * @memberof SharedLoadBalancerPools
     */
    self.delete = function () {

        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (balancers) {
                return Promise.settle(_.map(balancers, deletePool));
            });

        return new NoWaitOperationPromise(queueClient, processedPoolRefs, "Delete Balancer Pool").fromInspections(result);
    };

    function modifySingle(modificationConfig, pool) {
        return loadBalancerClient.modifyLoadBalancerPool(
                pool.id, pool.balancer.dataCenter.id, pool.balancer.id,  _.omit(modificationConfig, "port", "nodes"))
            .then(_.partial(modifyNodes, modificationConfig, processedPoolRef(pool)))
            .then(_.partial(Promise.resolve, pool));
    }

    function modifyNodes(command, pool) {
        if (command.nodes) {
            return self.nodes().modify({pool: pool}, command.nodes)
                .then(_.partial(Promise.resolve, pool));
        }

        return Promise.resolve(pool);
    }

    /**
     * Method allow to modify load balancer pool resource settings
     *
     * @param {LoadBalancerPoolCriteria} poolCriteria - criteria that specify set of pools that will be modified
     *
     * @param {ModifyPoolConfig} modificationConfig - update config
     *
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof SharedLoadBalancerPools
     */
    self.modify = function (poolCriteria, modificationConfig) {
        var criteria = initCriteria(poolCriteria);

        var result = self.find(criteria)
            .then(function(balancers) {
                return Promise.settle(_.map(balancers, _.partial(modifySingle, modificationConfig)));
            });

        return new NoWaitOperationPromise(queueClient, processedPoolRefs, "Update Balancer Pool")
            .fromInspections(result);
    };

    /**
     * Method allows to search load balancer pools.
     *
     * @param {LoadBalancerPoolCriteria} arguments - criteria that specify set of balancer pools that will be searched
     *
     * @return {Promise<Array<SharedLoadBalancerPoolMetadata>>} - promise that resolved by list of pools.
     *
     * @instance
     * @function find
     * @memberof SharedLoadBalancerPools
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var balancerCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.balancer;
        });

        return loadBalancerGroups.find(balancerCriteria)
            .then(loadBalancerPools)
            .then(_.flatten)
            .then(_.partial(filterPools, _, criteria));
    };

    function loadBalancerPools(balancers) {
        return Promise.all(
            _.map(balancers, function(balancer) {
                return loadBalancerClient.findLoadBalancerPools(balancer.dataCenter.id, balancer.id)
                    .then(function(pools) {
                        _.each(pools, function(pool) {
                            pool.balancer = balancer;
                        });

                        return pools;
                    });
            })
        );
    }

    function filterPools(pools, criteria) {
        if (!pools || pools.length === 0) {
            return [];
        }
        return _.filter(pools, new LoadBalancerPoolCriteria(criteria).predicate().fn);
    }

    function initCriteria() {
        return new LoadBalancerPoolCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    init();
}
},{"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/criteria.js":94,"./../../../core/search/search-support.js":96,"./domain/pool-criteria.js":24,"bluebird":"bluebird","underscore":"underscore"}],27:[function(require,module,exports){

var _ = require('underscore');
var ServerClient = require('./servers/server-client.js');
var GroupClient = require('./groups/group-client.js');
var PolicyClient = require('./policies/policy-client.js');
var SharedLoadBalancerClient = require('./balancers/load-balancer-client.js');
var NetworkClient = require('./networks/network-client');
var CreateServerConverter = require('./servers/domain/create-server-converter.js');
var Servers = require('./servers/servers.js');
var Statistics = require('./statistics/statistics.js');
var Templates = require('./templates/templates.js');
var Groups = require('./groups/groups.js');
var Policies = require('./policies/policies.js');
var Balancers = require('./balancers/load-balancers.js');
var Networks = require('./networks/networks');
var DataCenter = require('./../base-services/datacenters/domain/datacenter.js');
var Server = require('./servers/domain/server.js');
var Group = require('./groups/domain/group.js');
var OsFamily = require('./templates/domain/os-family.js');
var Architecture = require('./servers/domain/architecture.js');
var Resource = require('./statistics/domain/resource.js');
var MonitoringStatsType = require('./statistics/domain/monitoring-stats-type.js');
var Policy = require('./policies/domain/policy.js');
var IpAddressDetails = require('./networks/domain/ip-address-details');
var Invoices = require('./invoices/invoices.js');


module.exports = ComputeServices;

function ComputeServices (getRestClientFn, baseServicesFn) {
    var self = this;

    function init () {

    }

    var serverClient = _.memoize(function () {
        return new ServerClient(getRestClientFn());
    });

    var groupClient = _.memoize(function () {
        return new GroupClient(getRestClientFn());
    });

    var queueClient = _.memoize(function () {
        return baseServicesFn()._queueClient();
    });

    var experimentalQueueClient = _.memoize(function () {
        return baseServicesFn()._experimentalQueueClient();
    });

    var policyClient = _.memoize(function () {
       return new PolicyClient(getRestClientFn());
    });

    self.policies = _.memoize(function () {
        return new Policies(baseServicesFn().dataCenters(), policyClient(), queueClient());
    });

    var balancerClient = _.memoize(function () {
        return new SharedLoadBalancerClient(getRestClientFn());
    });

    self.balancers = _.memoize(function () {
        return new Balancers(baseServicesFn().dataCenters(), balancerClient(), queueClient());
    });

    var networkClient = _.memoize(function () {
        return new NetworkClient(getRestClientFn());
    });

    self.networks = _.memoize(function () {
        return new Networks(baseServicesFn().dataCenters(), networkClient(), experimentalQueueClient());
    });

    var serverConverter = _.memoize(function () {
        return new CreateServerConverter(
            self.groups(),
            self.templates(),
            baseServicesFn().accountClient(),
            self.policies()
        );
    });

    self.groups = _.memoize(function () {
        return new Groups(
            baseServicesFn().dataCenters(),
            groupClient(),
            queueClient(),
            baseServicesFn().accountClient(),
            self.policies()
        );
    });

    self.servers = _.memoize(function () {
        return new Servers(
            serverClient(),
            serverConverter(),
            queueClient(),
            self.groups(),
            self.networks(),
            experimentalQueueClient(),
            self.policies()
        );
    });

    self.groups()._serverService(self.servers);

    self.templates = _.memoize(function () {
        return new Templates(baseServicesFn().dataCenters(), serverClient());
    });

    self.statistics = _.memoize(function() {
        return new Statistics(
            self.servers(),
            self.groups(),
            baseServicesFn().dataCenters()
        );
    });

    self.invoices = _.memoize(function() {
        return new Invoices(
            serverClient()
        );
    });

    self.DataCenter = DataCenter;

    self.OsFamily = OsFamily;

    self.Machine = {
        Architecture: Architecture
    };

    self.Server = Server;

    self.Group = Group;

    self.Resource = Resource;

    self.MonitoringStatsType = MonitoringStatsType;

    self.Policy = Policy;

    self.IpAddressDetails = IpAddressDetails;

    init ();
}

},{"./../base-services/datacenters/domain/datacenter.js":7,"./balancers/load-balancer-client.js":19,"./balancers/load-balancers.js":20,"./groups/domain/group.js":30,"./groups/group-client.js":32,"./groups/groups.js":33,"./invoices/invoices.js":35,"./networks/domain/ip-address-details":36,"./networks/network-client":39,"./networks/networks":40,"./policies/domain/policy.js":51,"./policies/policies.js":58,"./policies/policy-client.js":59,"./servers/domain/architecture.js":60,"./servers/domain/create-server-converter.js":61,"./servers/domain/server.js":67,"./servers/server-client.js":70,"./servers/servers.js":71,"./statistics/domain/monitoring-stats-type.js":76,"./statistics/domain/resource.js":77,"./statistics/statistics.js":78,"./templates/domain/os-family.js":79,"./templates/templates.js":82,"underscore":"underscore"}],28:[function(require,module,exports){

var SingleGroupCriteria = require('./single-group-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = GroupCriteria;

/**
 * Class that used to filter groups
 * @typedef GroupCriteria
 * @type {(SingleGroupCriteria|CompositeCriteria)}
 *
 */
function GroupCriteria (criteria) {
    return new SearchCriteria(criteria, SingleGroupCriteria);
}
},{"./../../../core/search/common-criteria.js":92,"./single-group-criteria.js":31}],29:[function(require,module,exports){
var _ = require("underscore");

module.exports = GroupMetadata;

function GroupMetadata() {
    var self = this;

    self.getAllGroups = function() {
        var group = this;

        _.each(group.groups, function(subgroup) {
            subgroup.dataCenter = group.dataCenter;
        });

        return _.chain(_.asArray(
                group,
                _.map(group.groups, function(subgroup) {
                    return _.applyMixin(GroupMetadata, subgroup).getAllGroups();
                })
            ))
            .filter(filterFn)
            .uniq(filterFn)
            .value();
    };

    self.getAllServers = function() {
        var group = this;

        var groups = group.getAllGroups();

        var allServers = _.map(groups, function(group) {
            return _.map(group.servers, function(server) {
                server.group = group;
                return server;
            });
        });

        return _.chain(allServers)
            .flatten()
            .uniq(filterFn)
            .value();
    };

    self.getParentGroupId = function() {
        var group = this;
        var parentGroupLink = _.findWhere(group.links, {rel: 'parentGroup'});
        return parentGroupLink ? parentGroupLink.id : null;
    };

    self.getGroups = function() {
        var group = this;

        return _.applyMixin(GroupMetadata, group.groups);
    };

    function filterFn (metadata) {
        return metadata.id;
    }
}
},{"underscore":"underscore"}],30:[function(require,module,exports){

var Group = {
    DEFAULT: 'Default Group',
    ARCHIVE: 'Archive',
    TEMPLATES: 'Templates'
};

module.exports = Group;

},{}],31:[function(require,module,exports){

var Predicate = require('./../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleGroupCriteria;


/**
 * The type of {@link GroupCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleGroupCriteria
 * @type {object}
 *
 * @property {string} id - a group id restriction.
 * @property {string} name - a group name restriction.
 * @property {string} nameContains - restriction that pass only group which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only group which description contains specified keyword.
 * @property {function} where - restriction that pass only group which data match function logic.
 * @property {boolean} rootGroup - restriction that pass only root data center group.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only group which data center name contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example group criteria
 * {
 *     name: [Group.DEFAULT],
 *     descriptionContains: "blah",
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.servers.length > 0;
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleGroupCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    function filterRootGroup() {
        if (criteria.rootGroup === true) {
            return  new Predicate(function(data) {
                return data.getParentGroupId() === null;
            });
        }
        return Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byParamMatch('descriptionContains', 'description'))
            .and(filterRootGroup()),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self, true);
    };

    init();
}
},{"./../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../core/predicates/predicates.js":91,"./../../../core/search/criteria.js":94}],32:[function(require,module,exports){

var _ = require('underscore');


module.exports = GroupClient;

function GroupClient(rest) {
    var self = this;

    self.createGroup = function (createGroupRequest) {
        return rest.postJson('/v2/groups/{ACCOUNT}/', createGroupRequest);
    };

    self.deleteGroup = function (groupId) {
        return rest.delete('/v2/groups/{ACCOUNT}/' + groupId);
    };

    self.findGroupById = function (groupId, includeServerDetails) {
        return rest.get('/v2/groups/{ACCOUNT}/' + groupId + (includeServerDetails ? "?serverDetail=detailed" : ""));
    };

    self.modifyGroup = function (groupId, changesConfig) {
        var request = _.map(_.keys(changesConfig), function (curKey) {
            return {
                op: 'set',
                member: curKey,
                value: changesConfig[curKey]
            };
        });

        return rest.patchJson('/v2/groups/{ACCOUNT}/' + groupId, request);
    };

    self.getGroupBillingStats = function (groupId) {
        return rest.get('/v2/groups/{ACCOUNT}/' + groupId + '/billing');
    };

    self.getGroupMonitoringStats = function (groupId, request) {
        var url = composeGetRequestUrl(
            '/v2/groups/{ACCOUNT}/' + groupId + '/statistics',
            request
        );

        return rest.get(url);
    };

    function composeGetRequestUrl(url, params) {
        var isFirstParam = true;

        for (var property in params) {
            if (!params.hasOwnProperty(property)) {
                continue;
            }

            url += isFirstParam ? '?' : '&';
            url += property + '=' + params[property];

            isFirstParam = false;
        }

        return url;
    }
}

},{"underscore":"underscore"}],33:[function(require,module,exports){

var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var _ = require('./../../core/underscore.js');
var GroupCriteria = require("./domain/group-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/search/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');
var BillingStatsConverter = require('./../statistics/domain/billing-stats-converter.js');
var MonitoringStatsConverter = require('./../statistics/domain/monitoring-stats-converter.js');

var GroupMetadata = require('./domain/group-metadata.js');


module.exports = Groups;

/**
 * Service that allow to manage groups in CenturyLink Cloud
 *
 * @param {DataCenters} dataCenterService
 * @param {GroupClient} groupClient
 * @param {QueueClient} queueClient
 * @param {AccountClient} accountClient
 * @param {Policies} policyService
 * @constructor
 */
function Groups(dataCenterService, groupClient, queueClient, accountClient, policyService) {
    var self = this;

    var billingStatsConverter = new BillingStatsConverter();

    self._serverService = function(serverService) {
        self.serverService = serverService;
    };

    function init () {
        SearchSupport.call(self);
    }

    function initCriteria() {
        return new GroupCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    function resolveParentGroup(command) {
        return (command.parentGroupId || !command.parentGroup) && command ||
            self
                .findSingle(command.parentGroup)
                .then(function (data) {
                    delete command.parentGroup;
                    return _.extend(command, {parentGroupId: data.id});
                });
    }

    function resolveCustomFields(command) {
        if (command.customFields) {
            return accountClient.getCustomFields()
                .then(_.partial(filterCustomFields, command))
                .then(_.partial(composeCustomFields, command));
        }

        return command;
    }

    function filterCustomFields(command, availableFields) {
        var filteredFields = _.map(command.customFields, function(criteria) {
                var byName = _.filter(availableFields, function(field) {
                    return field.name === criteria.name;
                });
                var byFunction = criteria.where ? _.filter(availableFields, criteria.where) : [];
                return _.asArray(byName, byFunction);
            }
        );
        return _.chain(filteredFields)
            .flatten()
            .uniq(function(field) {
                return field.id;
            })
            .value();
    }

    function composeCustomFields(command, filteredFields) {
        command.customFields = _.map(filteredFields, function(field) {
            return {
                id: field.id,
                value: _.find(command.customFields, function(criteria) {
                    return criteria.name === field.name || criteria.where(field);
                }).value
            };
        });
        return command;
    }

    /**
     * Method allow to create group
     *
     * @param {object} command
     * @param {GroupCriteria} command.parentGroup - GroupSearchCriteria that specify one single target group
     * @param {string} command.name - target group name
     * @param {string} command.description - target group description
     * @param {Array<CustomField>} command.customFields - the list with custom fields {name, where}
     *
     * @instance
     * @function create
     * @memberof Groups
     */
    self.create = function (command) {
        var result = Promise
            .resolve(command)
            .then(resolveParentGroup)
            .then(resolveCustomFields)
            .then(groupClient.createGroup);

        return new NoWaitOperationPromise(queueClient, processedGroupRef, "Create Group").from(result);
    };

    function deleteGroup (groupMetadata) {
        return groupClient
            .deleteGroup(groupMetadata.id)
            .then(function (jobInfo) {
                jobInfo.groupId = groupMetadata.id;
                return jobInfo;
            });
    }

    /**
     * Method allow to delete group of servers
     * @param {GroupCriteria} arguments
     *
     * @returns {OperationPromise}
     *
     * @instance
     * @function delete
     * @memberof Groups
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (groups) {
                return Promise.settle(_.map(groups, deleteGroup));
            });

        return new OperationPromise(queueClient, createListOfGroupRefs, "Delete Group").fromInspections(result);
    };

    function createListOfGroupRefs(jobInfoList) {
        return jobInfoList.map(function (curInfo) {
            return { id: curInfo.groupId };
        });
    }

    function processedGroupRef(response) {
        return { id: response.id };
    }

    self._findByRef = function (groupRef, includeServerDetails) {
        return groupClient
            .findGroupById(groupRef.id ? groupRef.id : groupRef, includeServerDetails)
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    function modifySingle(modificationConfig, groupId) {
        return Promise
            .props({
                operation: groupClient.modifyGroup(groupId, modificationConfig),
                id: groupId
            })
            .then(processedGroupRef);
    }

    function mapGroupId (groups) {
        return groups.map(_.property('id'));
    }

    function resolveParentGroupId(modificationConfig) {
        return Promise
            .resolve(modificationConfig)
            .then(resolveParentGroup);
    }

    function findTargetGroupIds(criteria) {
        return self
            .find(criteria)
            .then(mapGroupId);
    }

    /**
     * Method allow to modify group resource settings
     *
     * @param {GroupCriteria} groupCriteria - criteria that specify set of groups that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new group name
     * @param {string} modificationConfig.description - new value of group description
     * @param {GroupCriteria} modificationConfig.parentGroup - reference to group that will be set as parent
     *                              of current group
     * @param {Array<CustomField>} modificationConfig.customFields - target entity custom fields
     * @return {Promise<GroupCriteria[]>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Groups
     */
    self.modify = function (groupCriteria, modificationConfig) {
        var criteria = self._searchCriteriaFrom(groupCriteria);

        return Promise
            .all([
                resolveParentGroupId(modificationConfig)
                .then(resolveCustomFields),
                findTargetGroupIds(criteria)
            ])
            .then(function (results) {
                var ids = results[1];
                var groupDiff = results[0];
                var modifyGroupById = _.partial(modifySingle, groupDiff);

                return ids.map(modifyGroupById);
            })
            .then(Promise.all);
    };

    /**
     * Method allows to search groups.
     *
     * @param {GroupCriteria} arguments - criteria that specify set of groups that will be searched
     *
     * @return {Promise<Array<GroupMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Groups
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        var filteredByDataCenterPromise;
        if (!dataCenterCriteria) {
            filteredByDataCenterPromise = Promise.resolve([]);
        } else {
            filteredByDataCenterPromise = dataCenterService.find(dataCenterCriteria)
                .then(loadRootGroups);
        }

        return filteredByDataCenterPromise
            .then(_.partial(loadGroupsById, criteria))
            .then(_.flatten)
            .then(loadDataCenterToGroups)
            .then(addDataCenterToGroups)
            .then(_.partial(_.applyMixin, GroupMetadata))
            .then(collectAllGroups)
            .then(_.partial(filterGroups, criteria))
            .then(_.partial(_.applyMixin, GroupMetadata));
    };

    function loadRootGroups(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return self.findSingle({id: dataCenter.getGroupId()});
            })
        );
    }

    function loadGroupsById(criteria, rootGroups) {
        var allIds = new Criteria(criteria).extractIdsFromCriteria();
        if (!_.isEmpty(allIds)) {
            return Promise.join(
                Promise.all(
                    _.map(_.asArray(allIds), function(groupId) {
                        return self._findByRef({id: groupId});
                    })),
                rootGroups
            );
        } else {
            return rootGroups;
        }
    }

    function loadDataCenterToGroups(groups) {
        return Promise.all(_.map(groups, function(group) {
            return Promise.props({
                group: group,
                dataCenter: dataCenterService.findSingle({id: group.locationId.toLowerCase()})
            });
        }));
    }

    function addDataCenterToGroups(enhancedGroups) {
        return _.map(enhancedGroups, function(prop) {
            prop.group.dataCenter = prop.dataCenter;
            return prop.group;
        });
    }

    function collectAllGroups(groups) {
        return _.chain(_.map(
            groups,
            function(group) {
                return group.getAllGroups();
            }))
            .flatten()
            .uniq(_.property('id'))
            .flatten()
            .value();
    }

    function filterGroups(criteria, groups) {

        if (!groups || groups.length === 0) {
            return [];
        }
        return _.filter(groups, new GroupCriteria(criteria).predicate().fn);
    }

    /**
     * Power on servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be started
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function powerOn
     */
    self.powerOn = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().powerOn({group: criteria});
    };

    /**
     * Power off servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be stopped
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function powerOff
     */
    self.powerOff = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().powerOff({group: criteria});
    };

    /**
     * Pause servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be paused
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function pause
     */
    self.pause = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().pause({group: criteria});
    };

    /**
     * Start maintenance servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function startMaintenance
     */
    self.startMaintenance = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().startMaintenance({group: criteria});
    };

    /**
     * Stop maintenance servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function stopMaintenance
     */
    self.stopMaintenance = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().stopMaintenance({group: criteria});
    };

    /**
     * Shut down servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function shutDown
     */
    self.shutDown = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().shutDown({group: criteria});
    };

    /**
     * Reboot servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function reboot
     */
    self.reboot = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().reboot({group: criteria});
    };

    /**
     * Reset servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function reset
     */
    self.reset = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().reset({group: criteria});
    };

    /**
     * Archive servers.
     * @param {GroupCriteria} arguments - criteria that specify set of groups with servers that will be processed
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function archive
     */
    self.archive = function() {
        var criteria = initCriteria(arguments);

        return self.serverService().archive({group: criteria});
    };

    /**
     * Define infrastructure with servers and groups.
     * @param {InfrastructureConfig} infraStructureConfig - the config of infrastructure
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function defineInfrastructure
     */
    self.defineInfrastructure = function(infraStructureConfig) {
        return definePolicies(infraStructureConfig)
            .then(_.partial(self.defineGroupHierarchy, infraStructureConfig.dataCenter, infraStructureConfig))
            .then(_.flatten)
            .then(_.uniq);
    };

    function definePolicies(infraStructureConfig) {
        return Promise.join(
            defineAlertPolicies(infraStructureConfig), defineAntiAffinityPolicies(infraStructureConfig)
        );
    }

    function defineAlertPolicies(infraStructureConfig) {
        if (infraStructureConfig.alertPolicies) {
            return Promise.all(
                _.map(_.asArray(infraStructureConfig.alertPolicies), function(policyConfig) {
                    return policyService.alert().create(policyConfig);
                })
            );
        }
        return Promise.resolve(infraStructureConfig);
    }

    function defineAntiAffinityPolicies(infraStructureConfig) {
        if (infraStructureConfig.antiAffinityPolicies) {
            return Promise.all(
                _.map(_.asArray(infraStructureConfig.antiAffinityPolicies), function(policyConfig) {
                    return policyService.antiAffinity().create(
                        _.extend(policyConfig, {dataCenter: infraStructureConfig.dataCenter})
                    );
                })
            );
        }
        return Promise.resolve(infraStructureConfig);
    }

    function extractParentGroupId(config) {
        return {id: config.groupId};
    }

    /**
     * Define group hierarchy with servers in data centers, specified by dataCenterCriteria.
     * @param {DataCenterCriteria} dataCenterCriteria - criteria that specify set of data centers
     * @param {GroupConfig} hierarchyConfig - the config of hierarchy
     * @returns {Promise} the queued operation
     *
     * @memberof Groups
     * @instance
     * @function defineGroupHierarchy
     */
    self.defineGroupHierarchy = function(dataCenterCriteria, hierarchyConfig) {
        return dataCenterService.find(dataCenterCriteria)
            .then(function(dataCenters) {
                return Promise.all(_.map(dataCenters, _.partial(createHierarchy, hierarchyConfig)));
            })
            .then(_.partial(_.map, _, extractParentGroupId));
    };

    /**
     * Get billing stats by groups.
     * @param {GroupCriteria} arguments - criteria that specify set of groups that will be searched
     * @returns {Promise} - promise that resolved by list of BillingStats.
     *
     * @instance
     * @function getBillingStats
     * @memberof Groups
     */
    self.getBillingStats = function() {
        return self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (groups) {
                return Promise.all(_.map(groups, getGroupBillingStats));
            });
    };

    function getGroupBillingStats(group) {
        return groupClient
            .getGroupBillingStats(group.id)
            .then(billingStatsConverter.convertClientResponse);
    }

    /**
     * Get monitoring stats by groups.
     * @param {GroupCriteria} groupCriteria - group search criteria
     * @param {TimeFilter} filter - statistics time filter
     *
     * @returns {Promise} - promise that resolved by list of MonitoringStats.
     *
     * @instance
     * @function getMonitoringStats
     * @memberof Groups
     */
    self.getMonitoringStats = function(groupCriteria, filter) {
        var converter = new MonitoringStatsConverter();

        return self
            .find(self._searchCriteriaFrom(groupCriteria))
            .then(function (groups) {
                return Promise.all(_.map(groups, _.partial(getGroupMonitoringStats, filter, converter)));
            });
    };

    function getGroupMonitoringStats(filter, converter, group) {
        var request = converter.validateAndConvert(filter);

        return Promise.props({
            group: group,
            servers: groupClient.getGroupMonitoringStats(group.id, request)
        });
    }

    function createHierarchy(config, parentGroupId, dataCenter) {
        //on first iteration it will be dataCenter
        if (parentGroupId instanceof Object) {
            dataCenter = parentGroupId;
            parentGroupId = parentGroupId.getGroupId();
        }
        if (!isServerConfig(config)) {
            var groupConfig = config.group instanceof Object ? config.group : {name: config.group};
            return createGroup(groupConfig, parentGroupId)
                .then(function(groupMetadata) {
                    config.groupId = groupMetadata.id;
                })
                .then(function() {
                    var createHierarchyFn = _.partial(createHierarchy, _, config.groupId, dataCenter);
                    return Promise.all(_.map(config.subItems, createHierarchyFn));
                })
                .then(_.partial(Promise.resolve, config));
        } else {
            var serverConfig = _.extend(config, {groupId: parentGroupId});

            if (serverConfig.template) {
                serverConfig.template.dataCenter = dataCenter;
            }

            if (serverConfig.machine && serverConfig.machine.antiAffinity) {
                serverConfig.machine.antiAffinity.dataCenter = dataCenter;
            }

            var count = serverConfig.count || 1;

            return Promise.all(_.times(count, _.partial(createServer, serverConfig)));
        }
    }

    function createGroup(config, parentGroupId) {
        return self.create(_.omit(_.extend(config, {parentGroupId: parentGroupId}), "subItems", "dataCenter"));
    }

    function createServer(serverConfig) {
        return self.serverService().create(_.omit(serverConfig, "count"))
            .then(_.partial(Promise.resolve, serverConfig));
    }

    function isServerConfig(config) {
        return config.group === undefined;
    }

    init();
}
},{"./../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../base-services/queue/domain/operation-promise.js":13,"./../../core/search/criteria.js":94,"./../../core/search/search-support.js":96,"./../../core/underscore.js":97,"./../statistics/domain/billing-stats-converter.js":72,"./../statistics/domain/monitoring-stats-converter.js":74,"./domain/group-criteria.js":28,"./domain/group-metadata.js":29,"bluebird":"bluebird"}],34:[function(require,module,exports){

var moment = require('moment');

module.exports = InvoiceConverter;

function InvoiceConverter() {

    var self = this;

    self.convert = function(params) {
        var result = {};

        result.pricingAccountAlias = params.pricingAccountAlias || null;

        if (params.year === undefined || params.month === undefined) {
            var date = params.date ? moment(params.date) : moment();
            result.year = date.year();
            /* Due to momentjs accepts numbers from 0 to 11 for months */
            result.month = date.month() + 1;
        } else {
            result.year = params.year;
            result.month = params.month;
        }

        return result;
    };
}
},{"moment":"moment"}],35:[function(require,module,exports){

var InvoiceConverter = require('./domain/invoice-converter.js');

module.exports = Invoices;

/**
 * The service that works with account invoices
 *
 * @constructor
 */
function Invoices (serverClient) {
    var self = this;

    function init () {}

    /**
     * Gets a list of invoicing data for a given account alias for a given month
     * @param {Object} params - invoice params
     * @example
     * {
     *     year: 2015,
     *     month: 7,
     *     pricingAccountAlias: 'PALIAS'
     * }
     * {
     *     date: moment().subtract(2, 'months')
     * }
     * {
     *     date: new Date('2015-09-01T03:24:00')
     * }
     * @returns {Promise<InvoiceData>} - promise that resolved by InvoiceData.
     *
     * @instance
     * @function getInvoice
     * @memberof Invoices
     */
    self.getInvoice = function (params) {
        var convertedParams = new InvoiceConverter().convert(params);

        return serverClient.getInvoice(
            convertedParams.year,
            convertedParams.month,
            convertedParams.pricingAccountAlias
        );
    };

    init();
}

},{"./domain/invoice-converter.js":34}],36:[function(require,module,exports){

var IpAddressDetails = {
    NONE: 'none',
    CLAIMED: 'claimed',
    FREE: 'free',
    ALL: 'all'
};

module.exports = IpAddressDetails;

},{}],37:[function(require,module,exports){

var SingleCriteria = require('./single-network-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = NetworkCriteria;

/**
 * Class that used to filter networks
 * @typedef NetworkCriteria
 * @type {(SingleNetworkCriteria|CompositeCriteria)}
 *
 */
function NetworkCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}
},{"./../../../core/search/common-criteria.js":92,"./single-network-criteria.js":38}],38:[function(require,module,exports){

var Predicate = require('./../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleGroupCriteria;


/**
 * The type of {@link NetworkCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleNetworkCriteria
 * @type {object}
 *
 * @property {string} id - a network id restriction.
 * @property {string} name - a network name restriction.
 * @property {string} gateway - a network gateway restriction.
 * @property {string} netmask - a network netmask restriction.
 * @property {int} vlan - a network vlan restriction.
 * @property {string} nameContains - restriction that pass only network which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only network which description contains specified keyword.
 * @property {function} where - restriction that pass only network which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only group which data center name contains specified keyword.
 *
 * @example
 * {
 *     name: "vlan_9998_12.34.0",
 *     descriptionContains: "12.34.0",
 *     gateway: "12.34.0.1",
 *     netmask: "255.255.255.0",
 *     vlan: 9998,
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(metadata) {
 *          return metadata.type === "private";
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleGroupCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('name'))
            .and(filters.byParamAnyOf('gateway'))
            .and(filters.byParamAnyOf('netmask'))
            .and(filters.byParamAnyOf('vlan'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byParamMatch('descriptionContains', 'description')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    init();
}
},{"./../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../core/predicates/predicates.js":91,"./../../../core/search/criteria.js":94}],39:[function(require,module,exports){

module.exports = NetworkClient;

function NetworkClient(rest) {
    var self = this;

    self.findNetworks = function (dataCenterId) {
        return rest.get('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId);
    };

    self.findNetwork = function (networkId, dataCenterId, ipAddressesDetails) {
        return rest.get('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + '/' + networkId +
            (ipAddressesDetails ? ("?ipAddresses=" + ipAddressesDetails) : ""));
    };

    self.claimNetwork = function(dataCenterId){
        return rest.postJson('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/claim");
    };

    self.updateNetwork = function(dataCenterId, networkId, updateRequest){
        return rest.putJson(
            '/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/" + networkId,
            updateRequest
        );
    };

    self.releaseNetwork = function(dataCenterId, networkId){
        return rest.postJson('/v2-experimental/networks/{ACCOUNT}/' + dataCenterId + "/" + networkId + "/release");
    };
}

},{}],40:[function(require,module,exports){

var _ = require('underscore');
var NetworkCriteria = require("./domain/network-criteria.js");
var Promise = require("bluebird");
var Criteria = require('./../../core/search/criteria.js');
var DataCenterCriteria = require('./../../base-services/datacenters/domain/datacenter-criteria.js');
var SearchSupport = require('./../../core/search/search-support.js');
var NoWaitOperationPromise = require('./../../base-services/queue/domain/no-wait-operation-promise.js');
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');

module.exports = Networks;

/**
 * @typedef NetworkMetadata
 * @type {object}
 * @property {string} id - ID of the network being queried.
 * @property {string} name - Name of the network
 * @property {string} description - User-defined description of this network
 * @property {string} cidr - The network address, specified using CIDR notation
 * @property {string} gateway - Gateway IP address of the network
 * @property {string} netmask - A screen of numbers used for routing traffic within a subnet
 * @property {string} type - Network type, usually private for networks created by the user
 * @property {int} vlan - Unique number assigned to the VLAN
 * @property {Array} ipAddresses - IP addresses details
 * @property {Array} links - Collection of entity links that point to resources related to this network
 *
 * @example
 * {
 *  "id": "5f75bcd83292477089ad47ab90f135f3",
 *  "name": "vlan_309_10.110.109",
 *  "description": "vlan_309_10.110.109",
 *  "cidr": "10.110.109.0/24",
 *  "gateway": "10.110.109.1",
 *  "netmask": "255.255.255.0",
 *  "type": "private",
 *  "vlan": 309,
 *  "ipAddresses": [
 *    {
 *      "address": "10.110.109.12",
 *      "claimed": true,
 *      "primary": false,
 *      "server": "DE1ALTDCLN04",
 *      "type": "private"
 *    },
 *    {
 *      "address": "10.110.109.13",
 *      "claimed": true,
 *      "primary": false,
 *      "server": "DE1ALTDCLN05",
 *      "type": "private"
 *    }
 *  ],
 *  "links": []
 * }
 */

/**
 * Service that allow to manage networks in CenturyLink Cloud
 *
 * @param {DataCenters} dataCenterService
 * @param {NetworkClient} networkClient
 * @param {ExperimentalQueueClient} experimentalQueueClient
 * @constructor
 */
function Networks(dataCenterService, networkClient, experimentalQueueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    function initCriteria() {
        return new NetworkCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    /**
     * Method allows to claim networks
     *
     * @param {DataCenterCriteria} arguments - criteria that specify set of data centers
     * in which a network will be claimed
     * @returns {Promise} - promise.
     */
    self.claim = function() {
        return dataCenterService.find(arguments)
            .then(function(dataCenters) {
                return Promise.all(_.map(dataCenters, claimNetwork));
            })
            .then(_.noop);
    };

    function claimNetwork(dataCenter) {
        var promise = new OperationPromise(experimentalQueueClient, "Claim Network");

        networkClient.claimNetwork(dataCenter.id)
            .then(promise.resolveWhenJobCompleted, promise.processErrors);

        return promise;
    }

    function buildRef(network) {
        return {id: network.id};
    }

    /**
     * Method allows to update networks
     *
     * @param networkSearchCriteria - criteria that specify set of networks that will be updated
     * @param modifyConfig - the network update config
     * @returns {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     */
    self.modify = function(networkSearchCriteria, modifyConfig) {
        var result = self.find(networkSearchCriteria)
            .then(_.partial(_.map, _, _.partial(update, _, modifyConfig)))
            .then(Promise.settle);

        return new NoWaitOperationPromise(null, "Update Network").fromInspections(result);
    };

    function update(network, modifyConfig) {
        return networkClient.updateNetwork(network.dataCenter.id, network.id, modifyConfig)
            .then(_.partial(buildRef, network));
    }

    /**
     * Method allows to release a networks. Use this operation when you no longer need a network,
     * and wish to to release it back a given data center.
     * Before you can release a network, there must be no IP addresses claimed by servers.
     *
     * @param {NetworkCriteria} networkSearchCriteria - criteria that specify set of data centers
     * @returns {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     */
    self.release = function(networkSearchCriteria) {
        var result = self.find(networkSearchCriteria)
            .then(_.partial(_.map, _, releaseNetwork))
            .then(Promise.settle);

        return new NoWaitOperationPromise(null, "Release Network").fromInspections(result);
    };

    function releaseNetwork(network) {
        return networkClient.releaseNetwork(network.dataCenter.id, network.id)
            .then(_.partial(buildRef, network));
    }

    /**
     * Method allows to search networks.
     *
     * @param {NetworkCriteria} networkSearchCriteria - criteria that specify set of networks that will be searched
     * @param {string} ipAddressesDetails Optional component of the query to request details
     * of IP Addresses in a certain state. Should be one of the following:
     * "none" (returns details of the network only),
     * "claimed" (returns details of the network as well as information about claimed IP addresses),
     * "free" (returns details of the network as well as information about free IP addresses) or
     * "all" (returns details of the network as well as information about all IP addresses).
     *
     *
     * @return {Promise<Array<NetworkMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Networks
     */
    self.find = function(networkSearchCriteria, ipAddressesDetails) {
        var criteria = initCriteria(networkSearchCriteria);

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadNetworks)
            .then(enhanceNetworks)
            .then(_.flatten)
            .then(_.partial(filterNetworks, criteria))
            .then(_.partial(loadIpAddressesDetails, ipAddressesDetails));
    };

    function loadNetworks(dataCenters) {
        return Promise.all(
            _.map(dataCenters, function(dataCenter) {
                return Promise.props(
                    {
                        networks: networkClient.findNetworks(dataCenter.id),
                        dataCenter: dataCenter
                    }
                );
            })
        );
    }

    function enhanceNetworks(props) {
        return Promise.all(
            _.map(props, function(prop) {
                return _.map(prop.networks, function(network) {
                    network.dataCenter = prop.dataCenter;

                    return network;
                });
            })
        );
    }

    function filterNetworks(criteria, networks) {

        if (!networks || networks.length === 0) {
            return [];
        }
        return _.filter(networks, new NetworkCriteria(criteria).predicate().fn);
    }

    function loadIpAddressesDetails(ipAddressesDetails, networks) {
        if (!ipAddressesDetails) {
            return Promise.resolve(networks);
        }

        return Promise.all(
            _.map(networks, function(network) {
                return networkClient.findNetwork(network.id, network.dataCenter.id, ipAddressesDetails);
            })
        );
    }

    init();
}
},{"./../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../base-services/queue/domain/operation-promise.js":13,"./../../core/search/criteria.js":94,"./../../core/search/search-support.js":96,"./domain/network-criteria.js":37,"bluebird":"bluebird","underscore":"underscore"}],41:[function(require,module,exports){
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('./../../../core/underscore.js');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');


module.exports = Alert;

/**
 * @typedef AlertPolicyMetadata
 * @type {object}
 * @property {String} id - ID of the alert policy.
 * @property {String} name - Name of the alert policy.
 * @property {Array<ActionMetadata>} actions - The actions to perform when the alert is triggered.
 * @property {Array<TriggerMetadata>} triggers - The definition of the triggers that fire the alert.
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * "id":"999de90f25ab4308a6c346cd03602fef",
 *  "name":"Memory Above 90%",
 *  "actions":[
 *  {
 *      "action":"email",
 *      "settings":{
 *          "recipients":[
 *              "user@company.com"
 *          ]
 *      }
 *  }
 *  ],
 *  "links":[
 *  {
 *      "rel":"self",
 *      "href":"/v2/alertPolicies/ALIAS/999de90f25ab4308a6c346cd03602fef",
 *      "verbs":[
 *          "GET",
 *          "DELETE",
 *          "PUT"
 *      ]
 *  }
 *  ],
 *  "triggers":[
 *  {
 *      "metric":"memory",
 *      "duration":"00:10:00",
 *      "threshold":90.0
 *  }
 *  ]
 */
/**
 * @typedef ActionMetadata
 * @type {object}
 * @property {String} action - ID of the alert policy.
 * @property {Array} settings - The actions to perform when the alert is triggered.
 */
/**
 * @typedef TriggerMetadata
 * @type {object}
 * @property {String} metric - The metric on which to measure the condition that will trigger the alert:
 * cpu, memory, or disk.
 * @property {String} duration - The length of time in minutes that the condition must exceed the threshold:
 * 00:05:00, 00:10:00, 00:15:00.
 * @property {int} threshold - The threshold that will trigger the alert when the metric equals or exceeds it.
 * This number represents a percentage and must be a value between 5.0 - 95.0 that is a multiple of 5.0.
 */




/**
 * Service that allow to manage alert policies in CenturyLink Cloud
 *
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function Alert(policyClient, queueClient) {
    var self = this;

    var delay = 500;
    var maxThreshold = 95;
    var minThreshold = 5;

    function init () {
        SearchSupport.call(self);
    }

    function composePolicyConfig(command) {
        composeActions(command);
        _.each(command.triggers, composeTrigger);

        return command;
    }

    function composeActions(command) {

        if (command.actions && _.every(command.actions, _.isString)) {
            command.actions = [{
                action: "email",
                settings: {
                    recipients: command.actions
                }
            }];
        }

        _.each(command.actions, function(action) {
            if (action === undefined || action.action === undefined) {
                throw new Error("Please specify alert policy action");
            }
        });

        return command;
    }

    function composeTrigger(trigger) {
        trigger.duration = convertDuration(trigger.duration);
        trigger.threshold = convertThreshold(trigger.threshold);
    }

    function convertDuration(duration) {
        return "00:" + (duration > 9 ? duration : "0" + duration) + ":00";
    }

    function convertThreshold(threshold) {
        var rounded5 = Math.ceil(threshold/5)*5;

        if (rounded5 < minThreshold) {
            rounded5 = minThreshold;
        } else if (rounded5 > maxThreshold) {
            rounded5 = maxThreshold;
        }

        return rounded5;
    }

    /**
     * Method allow to create alert policy
     *
     * @param {object} command
     * @param {string} command.name - target policy name
     * @param {Array} command.actions - The actions to perform when the alert is triggered.
     * @param {Array} command.triggers - The definition of the triggers that fire the alert.
     *
     * @instance
     * @function create
     * @memberof Alert
     *
     * @returns {Promise<Array<Reference>>} the array of created policy reference
     */
    self.create = function (command) {
        var result = Promise.resolve(composePolicyConfig(command))
            .then(policyClient.createAlertPolicy)
            .delay(delay);

        return new NoWaitOperationPromise(queueClient, processPolicyRef, "Create Alert Policy").from(result);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteAlertPolicy(policyMetadata.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete alert policy
     * @param {AlertPolicyCriteria} args - criteria that specify set of policies that will be removed
     *
     * @returns {Promise<Array<Reference>>} the array of deleted policies references
     *
     * @instance
     * @function delete
     * @memberof Alert
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(_.partial(_.map, _, deletePolicy));

        return new NoWaitOperationPromise(queueClient, "Delete Alert Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
            var modifyConfig = _.chain(policy)
                .extend(config)
                .omit("links")
                .value();
                return policyClient.modifyAlertPolicy(policy.id, modifyConfig)
                    .delay(delay);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }

    /**
     * Method allow to modify alert policy
     *
     * @param {AlertPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new policy name
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Policies
     */
    self.modify = function (policyCriteria, modificationConfig) {
        return self.find(self._searchCriteriaFrom(policyCriteria))
            .then(_.partial(modifyPolicies, _, composePolicyConfig(modificationConfig)));
    };

    /**
     * Method allows to search alert policies.
     *
     * @param {AlertPolicyCriteria} args - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AlertPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Alert
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findAlertPolicies()
            .then(_.property('items'))
            .then(_.partial(filterPolicies, criteria));
    };

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}
},{"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/search-support.js":96,"./../../../core/underscore.js":97,"./domain/policy-criteria.js":42,"bluebird":"bluebird"}],42:[function(require,module,exports){

var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = AlertPolicyCriteria;

/**
 * Class that used to filter alert policies
 * @typedef AlertPolicyCriteria
 * @type {(SingleAlertPolicyCriteria|CompositeCriteria)}
 *
 */
function AlertPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-policy-criteria.js":43}],43:[function(require,module,exports){

var _ = require('underscore');
var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleAlertPolicyCriteria;


/**
 * The type of {@link AlertPolicyCriteria} that represents single search criteria.
 *
 * @typedef SingleAlertPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - an alert policy id restriction.
 * @property {String | Array<String>} name - an alert policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy
 * which name contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {Array<string>} actions - restriction that pass only policy which actions
 * contains specified criteria.
 * @property {Array<string>} metrics - restriction that pass only policy which trigger actions
 * contains specified criteria.
 *
 * @example policy criteria
 * {
 *     name: "My Policy",
 *     nameContains: "alert",
 *     where: function(policy) {
 *         return ["My Policy", "Custom Policy"].indexOf(policy.name) > -1;
 *     },
 *     actions: ["email"],
 *     metrics: ["memory", "cpu", "disk"] //compute.Policy.Alert.Metric.DISK
 * }
 */
function SingleAlertPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();
    }

    function filterByActions() {
        return new Predicate(function(data) {
            var actions = data.actions;
            if (criteria.actions) {
                var found = _.intersection(_.asArray(criteria.actions), _.pluck(_.asArray(actions), "name"));

                return found.length > 0;
            }

            return true;
        });
    }

    function filterByMetrics() {
        return new Predicate(function(data) {
            var triggers = data.triggers;
            if (criteria.metrics) {
                var found = _.intersection(_.asArray(criteria.metrics), _.pluck(_.asArray(triggers), "metric"));

                return found.length > 0;
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byId()
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filterByActions())
            .and(filterByMetrics()),

            path
        );
    };

    self.parseCriteria = function () {
        return criteria;
    };

    init();
}
},{"./../../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94,"underscore":"underscore"}],44:[function(require,module,exports){
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('underscore');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');


module.exports = AntiAffinity;

/**
 * @typedef AntiAffinityPolicyMetadata
 * @type {object}
 * @property {String} id - ID of the anti-affinity policy.
 * @property {String} name - Name of the anti-affinity policy.
 * @property {int} location - Data center location of the anti-affinity policy.
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *  "id":"80a7bf90b199454b859399bff54f4173",
 *  "name":"My Anti-Affinity Policy",
 *  "location":"VA1",
 *  "links":[
 *    {
 *      "rel":"self",
 *      "href":"/v2/antiAffinityPolicies/alias/80a7bf90b199454b859399bff54f4173",
 *      "verbs":[
 *        "GET",
 *        "DELETE",
 *        "PUT"
 *      ]
 *    },
 *    {
 *      "rel":"server",
 *      "href":"/v2/servers/alias/va1aliashypsc01",
 *      "id":"va1aliashypsc01",
 *      "name":"VA1ALIASHYPSC01"
 *    }
 *  ]
 * }
 */

/**
 * Service that allow to manage anti-affinity policy in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function AntiAffinity(dataCenterService, policyClient, queueClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    function composeCreatePolicyPromise(command) {
        return dataCenterService.find(command.dataCenter)
            .then(_.partial(loadDataCenters, command))
            .then(Promise.all);
    }

    function loadDataCenters(command, dataCenters) {
        return _.map(dataCenters, function(dataCenter) {
            return composeCreatePolicyRequest(dataCenter, command);
        });
    }

    function composeCreatePolicyRequest(dataCenter, command) {
        return {
            name: command.name,
            location: dataCenter.id
        };
    }

    /**
     * Method allow to create anti-affinity policy
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - DataCenterCriteria that specify data centers
     * @param {string} command.name - target policy name
     *
     * @returns {Promise<Array<Reference>>} the array of created policies references
     *
     * @instance
     * @function create
     * @memberof AntiAffinity
     */
    self.create = function (command) {
        var result = composeCreatePolicyPromise(command)
            .then(_.partial(_.map, _, policyClient.createAntiAffinityPolicy))
            .then(Promise.all);

        return new NoWaitOperationPromise(queueClient, processPolicyRefs, "Create Anti-Affinity Policy").from(result);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteAntiAffinityPolicy(policyMetadata.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete anti-affinity policy
     * @param {AntiAffinityPolicyCriteria} args - criteria that specify set of policies that will be deleted
     *
     * @returns {Promise<Array<Reference>>} the array of deleted policies references
     *
     * @instance
     * @function delete
     * @memberof AntiAffinity
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (policies) {
                return Promise.all(_.map(policies, deletePolicy));
            });

        return new NoWaitOperationPromise(queueClient, "Delete Anti-Affinity Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
                return policyClient.modifyAntiAffinityPolicy(policy.id, config);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }

    /**
     * Method allow to modify policy
     *
     * @param {AntiAffinityPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} modificationConfig
     * @param {string} modificationConfig.name - new policy name
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof AntiAffinity
     */
    self.modify = function (policyCriteria, modificationConfig) {
        var criteria = self._searchCriteriaFrom(policyCriteria);

        return self.find(criteria)
            .then(_.partial(modifyPolicies, _, modificationConfig));
    };

    /**
     * Method allows to search anti-affinity policies.
     *
     * @param {AntiAffinityPolicyCriteria} args - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AntiAffinityPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof AntiAffinity
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findAntiAffinityPolicies()
            .then(_.property('items'))
            .then(loadDataCenterToPolicies)
            .then(addDataCenterToPolicies)
            .then(_.partial(filterPolicies, criteria));
    };

    function loadDataCenterToPolicies(policies) {
        return Promise.all(_.map(policies, function(policy) {
            return Promise.props({
                policy: policy,
                dataCenter: dataCenterService.findSingle({id: policy.location.toLowerCase()})
            });
        }));
    }

    function addDataCenterToPolicies(enhancedPolicies) {
        return _.map(enhancedPolicies, function(prop) {
            prop.policy.dataCenter = prop.dataCenter;
            return prop.policy;
        });
    }

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}
},{"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/search-support.js":96,"./domain/policy-criteria.js":45,"bluebird":"bluebird","underscore":"underscore"}],45:[function(require,module,exports){

var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = AntiAffinityPolicyCriteria;

/**
 * Class that used to filter anti-affinity policies
 * @typedef AntiAffinityPolicyCriteria
 * @type {(SingleAntiAffinityPolicyCriteria|CompositeCriteria)}
 *
 */
function AntiAffinityPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-policy-criteria.js":46}],46:[function(require,module,exports){

var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');

module.exports = SingleAntiAffinityPolicyCriteria;


/**
 * The type of {@link AntiAffinityPolicyCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleAntiAffinityPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - a anti-affinity policy id restriction.
 * @property {String | Array<String>} name - a anti-affinity policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy which name
 * contains specified keyword.
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {String | Array<String>} dataCenterId - a data center id restriction.
 * @property {String | Array<String>} dataCenterName - a data center name restriction.
 * @property {String | Array<String>} dataCenterNameContains - restriction that pass only group which data center name
 * contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example policy criteria
 * {
 *     name: ["My Policy"],
 *     nameContains: "test",
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(policy) {
 *          return ["DE1", "GB1"].indexOf(policy.location) === -1;
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleAntiAffinityPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamMatch('nameContains', 'name')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self, true);
    };

    init();
}
},{"./../../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94}],47:[function(require,module,exports){
var _ = require('underscore');
var Vertical = require('./vertical/vertical');


module.exports = AutoScale;

/**
 * Service that allow to manage autoscale policies (vertical, horizontal) in CenturyLink Cloud
 *
 * @param policyClient
 * @constructor
 */
function AutoScale(policyClient) {
    var self = this;

    self.vertical = _.memoize(function () {
        return new Vertical(
            policyClient
        );
    });

}
},{"./vertical/vertical":50,"underscore":"underscore"}],48:[function(require,module,exports){

var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../../core/search/common-criteria.js');

module.exports = VerticalAutoScalePolicyCriteria;

/**
 * Class that used to filter auto scale policies
 * @typedef VerticalAutoScalePolicyCriteria
 * @type {(SingleVerticalAutoScalePolicyCriteria|CompositeCriteria)}
 *
 */
function VerticalAutoScalePolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}
},{"./../../../../../core/search/common-criteria.js":92,"./single-policy-criteria.js":49}],49:[function(require,module,exports){

var Predicate = require('./../../../../../core/predicates/predicates.js');
var Criteria = require('./../../../../../core/search/criteria.js');

module.exports = SingleVerticalAutoScalePolicyCriteria;


/**
 * The type of {@link VerticalAutoScalePolicyCriteria} that represents single search criteria.
 *
 * @typedef SingleVerticalAutoScalePolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - an auto scale policy id restriction.
 * @property {String | Array<String>} name - an auto scale policy name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only policy which name
 * contains specified keyword.
 *
 * @property {String | Array<String>} resourceType - a resource type restriction.
 * @property {int | Array<int>} thresholdPeriodMinutes - a threshold period in minutes restriction.
 * @property {int | Array<int>} scaleUpIncrement - a scale up increment restriction.
 * @property {int | Array<int>} scaleUpThreshold - a scale up threshold restriction.
 * @property {String | Array<String>} scaleDownThreshold - a scale down threshold restriction.
 *
 * @property {function} where - restriction that pass only policy which data match function logic.
 *
 * @example policy criteria
 * {
 *     name: ["My Policy"],
 *     nameContains: "test",
 *     resourceType: "cpu",
 *     thresholdPeriodMinutes: 30,
 *     scaleUpIncrement: 4,
 *     scaleUpThreshold: 50,
 *     scaleDownThreshold: 20,
 *     where: function(policy) {
 *          return 2 === policy.range.min && 4 === policy.range.max;
 *     }
 * }
 */
function SingleVerticalAutoScalePolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byId()
            .and(filters.byParamAnyOf('name'))
            .and(filters.byParamMatch('nameContains', 'name'))
            .and(filters.byCustomPredicate())
            .and(filters.byParamAnyOf('resourceType'))
            .and(filters.byParamAnyOf('thresholdPeriod', 'thresholdPeriodMinutes'))
            .and(filters.byParamAnyOf('scaleUpIncrement'))
            .and(filters.byParamAnyOf('scaleUpThreshold'))
            .and(filters.byParamAnyOf('scaleDownThreshold')),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self, true);
    };

    init();
}
},{"./../../../../../core/predicates/predicates.js":91,"./../../../../../core/search/criteria.js":94}],50:[function(require,module,exports){
var _ = require('underscore');
var PolicyCriteria = require("./domain/policy-criteria.js");
var SearchSupport = require('./../../../../core/search/search-support.js');


module.exports = Vertical;

/**
 * @typedef AutoScaleRange
 * @type {object}
 * @property {int} min - Minimum number of CPU
 * @property {int} max - Maximum number of CPU
 */

/**
 * @typedef ScaleDownWindow
 * @type {object}
 * @property {String} start - Start time of window in UTC
 * @property {String} end - End time of window in UTC
 */

/**
 * @typedef AutoScalePolicyMetadata
 * @type {object}
 * @property {String} id - ID of the anti-affinity policy.
 * @property {String} name - Name of the anti-affinity policy.
 * @property {String} resourceType - The resource type to autoscale; only cpu is supported at this time.
 * @property {int} thresholdPeriodMinutes - Duration the resource must be at min/max in order to autoscale
 * (5, 10, 15, or 30 minutes).
 * @property {int} scaleUpIncrement - Number of CPU to increase on a scale up event (1, 2, or 4).
 * @property {AutoScaleRange} range - The range defining the minimum and maximum number of CPU to allow (between 1-16).
 * @property {int} scaleUpThreshold - Will scale up when resource it at this setting for at least the threshold period
 * (between 1-100).
 * @property {int} scaleDownThreshold - Will scale down when resource it at this setting for at least the threshold period
 * (between 1-100).
 * @property {ScaleDownWindow} scaleDownWindow - A server reboot is required for all resource scale downs; this is
 * the scale down window during which the resource will be set to the policy's minimum value.
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *   "id": "3b6f26003c224596bc7e748a0adc97d5",
 *   "name": "Production Database Scale Policy",
 *   "resourceType": "cpu",
 *   "thresholdPeriodMinutes": 5,
 *   "scaleUpIncrement": 1,
 *   "range": {
 *     "max": 6,
 *     "min": 2
 *   },
 *   "scaleUpThreshold": 85,
 *   "scaleDownThreshold": 15,
 *   "scaleDownWindow": {
 *     "start": "02:00",
 *     "end": "04:00"
 *   },
 *   "links": [
 *     {
 *       "rel": "self",
 *       "href": "/v2/autoscalePolicies/ALIAS/3b6f26003c224596bc7e748a0adc97d5"
 *     }
 *   ]
 * }
 */

/**
 * Service that allow to manage auto scale policy in CenturyLink Cloud
 *
 * @param policyClient
 * @constructor
 */
function Vertical(policyClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Method allows to search auto scale policies.
     *
     * @param {AntiAffinityPolicyCriteria} arguments - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<AutoScalePolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Vertical
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        return policyClient.findVerticalAutoscalePolicies()
            .then(_.partial(filterPolicies, criteria));
    };

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}
},{"./../../../../core/search/search-support.js":96,"./domain/policy-criteria.js":48,"underscore":"underscore"}],51:[function(require,module,exports){
var Policy = {

    Alert: {
        Metric: {
            DISK: "disk",
            CPU: "cpu",
            MEMORY: "memory"
        }
    }
};

module.exports = Policy;
},{}],52:[function(require,module,exports){

var _ = require('underscore');
var Promise = require("bluebird");


module.exports = CreatePolicyJob;

function CreatePolicyJob(policyClient, result) {
    var self,
        resolve = _.noop,
        reject = _.noop,
        defaultTimeout = 5000;

    function init () {
        self = new Promise(saveResolveFn);
    }
    init ();

    function saveResolveFn(resolveFn, rejectFn) {
        resolve = resolveFn;
        reject = rejectFn;
    }

    function isJobFailed(status) {
        return !status || status === 'error';
    }

    function awaitFn(timeout) {
        return _.partial(self.await, timeout || defaultTimeout);
    }

    function makeJobFailedMessage(status) {
        return { status: status, job: result };
    }

    function onStatusReceived (timeout) {
        return function (status) {
            if (status === 'active') {
                resolve(result);
            } else if (isJobFailed(status)) {
                reject(makeJobFailedMessage(status));
            } else {
                setTimeout(awaitFn(timeout), timeout || defaultTimeout);
            }
        };
    }

    self.await = function (timeout) {
        policyClient
            .findFirewallPolicyById(result.id, result.dataCenterId)
            .then(_.property('status'))
            .then(onStatusReceived(timeout));

        return self;
    };

    return self;
}
},{"bluebird":"bluebird","underscore":"underscore"}],53:[function(require,module,exports){
var IpSubnetCalculator = require('ip-subnet-calculator');
var _ = require('underscore');

module.exports = IpToCidrConverter;

function IpToCidrConverter(ip, mask) {
    if (mask === undefined) {
        return _.map(_.asArray(ip), function(config) {
            if (config instanceof Object) {
                return convert(config.ip, config.mask);
            }
            return config;
        });
    }
    return convert(ip, mask);
}

function convert(ip, mask) {
    var subnet = IpSubnetCalculator.calculateCIDRPrefix(ip, mask);
    return subnet.ipLowStr + '/' + subnet.prefixSize;
}
},{"ip-subnet-calculator":"ip-subnet-calculator","underscore":"underscore"}],54:[function(require,module,exports){

var SinglePolicyCriteria = require('./single-policy-criteria.js');
var SearchCriteria = require('./../../../../core/search/common-criteria.js');

module.exports = FirewallPolicyCriteria;

/**
 * Class that used to filter anti-affinity policies
 * @typedef FirewallPolicyCriteria
 * @type {(SingleFirewallPolicyCriteria|CompositeCriteria)}
 *
 */
function FirewallPolicyCriteria (criteria) {
    return new SearchCriteria(criteria, SinglePolicyCriteria);
}
},{"./../../../../core/search/common-criteria.js":92,"./single-policy-criteria.js":56}],55:[function(require,module,exports){

var Port = {
    ANY: 'any',
    PING: 'icmp',
    HTTPS: TCP(443),
    HTTP_80: TCP(80),
    HTTP_8080: TCP(8080),
    SSH: TCP(22),
    RDP: TCP(3389),
    FTP: TCP(21),
    FTPS: TCP(990)

};

function convert(protocol, port, to) {
    if (to) {
        return protocol + '/' + port + '-' + to;
    }
    return protocol + '/' + port;
}

function TCP(port, to) {
    return convert('tcp', port, to);
}

Port.TCP = TCP;

function UDP(port, to) {
    return convert('udp', port, to);
}

Port.UDP = UDP;

Port.convert = convert;

module.exports = Port;
},{}],56:[function(require,module,exports){

var Predicate = require('./../../../../core/predicates/predicates.js');
var DataCenterCriteria = require('./../../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../../core/search/criteria.js');
var Port = require('./port');
var toCidr = require('./ip-converter');
var _ = require('underscore');

module.exports = SingleFirewallPolicyCriteria;


/**
 * The type of {@link FirewallPolicyCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleFirewallPolicyCriteria
 * @type {object}
 *
 * @property {String | Array<String>} id - a firewall policy id restriction.
 * @property {String | Array<String>} status - a firewall policy status restriction.
 * @property {boolean} enabled - restriction that pass only enabled policy.
 * @property {String | Array<String>} source - a firewall policy source restriction.
 * @property {String | Array<String>} destination - a firewall policy destination restriction.
 * @property {String | Array<String>} destinationAccount - a firewall policy destination account restriction.
 * @property {String | Array<String> | Port} ports - a firewall policy ports restriction.
 *
 * @property {function} where - restriction that pass only policy which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 *
 * @property {String | Array<String>} dataCenterId - a data center id restriction.
 * @property {String | Array<String>} dataCenterName - a data center name restriction.
 * @property {String | Array<String>} dataCenterNameContains - restriction that pass only group which data center name
 * contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example policy criteria
 * {
 *     status: ["active"],
 *     enabled: true,
 *     source: ["10.100.8.1/28", {ip: '10.15.8.1', mask: '255.255.255.0'}],
 *     destination: ["10.100.8.1/28"],
 *     destinationAccount: ["ACCT"],
 *     ports: [Port.PING, Port.TCP(8081, 8085)],
 *     dataCenter: [
 *         {id: ['de1']},
 *         {nameContains: 'Seattle'}
 *     ],
 *     where: function(policy) {
 *          return policy.source.length === 2;
 *     },
 *     dataCenterId: DataCenter.CA_TORONTO_1.id
 * }
 */
function SingleFirewallPolicyCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains'
        };
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
            .and(filters.byId())
            .and(filters.byParamAnyOf('status'))
            .and(filterEnabled())
            .and(filterByIp('source'))
            .and(filterByIp('destination'))
            .and(filters.byParamAnyOf('destinationAccount', true))
            .and(filterByPort())
            .and(filters.byCustomPredicate()),

            path
        );
    };

    self.parseCriteria = function () {
        return criteriaHelper.parseSingleCriteria(self);
    };

    function filterEnabled() {
        if (criteria.enabled === undefined) {
            return Predicate.alwaysTrue();
        }

        return Predicate.equalTo(criteria.enabled, 'enabled');
    }

    function filterByIp(property) {
        if (!criteria[property]) {
            return Predicate.alwaysTrue();
        }

        var ipCriteria = convertToCidr(criteria[property]);

        return new Predicate(function(data) {
            var ips = _.asArray(data[property]);

            return _.intersection(ipCriteria, ips).length !== 0;
        });

    }

    function convertToCidr(values) {
        return _.map(_.asArray(values), function(ipConfig) {
            if (ipConfig instanceof Object) {
                return toCidr(ipConfig.ip, ipConfig.mask);
            }

            return ipConfig;
        });
    }

    function filterByPort() {
        if (!criteria.ports) {
            return Predicate.alwaysTrue();
        }

        var portCriteria = _.asArray(criteria.ports);
        if (portCriteria.indexOf(Port.ANY) > -1) {
            return Predicate.alwaysTrue();
        }

        return new Predicate(function(data) {
            var ports = _.asArray(data.ports);

            return _.intersection(portCriteria, ports).length !== 0;
        });
    }

    init();
}
},{"./../../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../../core/predicates/predicates.js":91,"./../../../../core/search/criteria.js":94,"./ip-converter":53,"./port":55,"underscore":"underscore"}],57:[function(require,module,exports){
var NoWaitOperationPromise = require('./../../../base-services/queue/domain/no-wait-operation-promise.js');
var _ = require('underscore');
var PolicyCriteria = require("./domain/policy-criteria.js");
var Promise = require("bluebird");
var SearchSupport = require('./../../../core/search/search-support.js');
var Criteria = require('./../../../core/search/criteria.js');
var CreatePolicyJob = require('./domain/create-policy-job');
var Port = require('./domain/port');
var ToCidr = require('./domain/ip-converter');

module.exports = Firewall;

/**
 * @typedef FirewallPolicyMetadata
 * @type {object}
 * @property {String} id - ID of the firewall policy.
 * @property {String} status - The state of the policy; either active (policy is available and working as expected),
 * error (policy creation did not complete as expected) or pending (the policy is in the process of being created).
 * @property {boolean} enabled - Indicates if the policy is enabled (true) or disabled (false).
 * @property {Array<String>} source - Source addresses for traffic on the originating firewall,
 * specified using CIDR notation.
 * @property {Array<String>} destination - Destination addresses for traffic on the terminating firewall,
 * specified using CIDR notation.
 * @property {String} destinationAccount - Short code for a particular account.
 * @property {int} ports - Type of ports associated with the policy. Supported ports include:
 * any, icmp, TCP and UDP with single ports (tcp/123, udp/123) and port ranges (tcp/123-456, udp/123-456).
 * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
 * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
 * @property {Array} links - Collection of entity links that point to resources related to this policy.
 *
 * @example
 * {
 *    "id": "1ac853b00e1011e5b9390800200c9a6",
 *    "status": "active",
 *    "enabled": true,
 *    "source": [
 *        "123.45.678.1/32",
 *        "123.45.678.2/32",
 *        "123.45.678.3/32"
 *    ],
 *    "destination": [
 *        "245.21.223.1/32",
 *        "245.21.223.2/32"
 *    ],
 *    "destinationAccount": "DEST_ALIAS",
 *    "ports": [
 *        "any"
 *    ],
 *    "links": [
 *        {
 *            "rel": "self",
 *            "href": "https://api.ctl.io/v2-experimental/firewallPolicies/SRC_ALIAS/WA1/1ac853b00e1011e5b9390800200c9a6",
 *            "verbs": [
 *                "GET",
 *                "PUT",
 *                "DELETE"
 *            ]
 *        }
 *    ]
 * }
 */

/**
 * Service that allow to manage firewall policy in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @constructor
 */
function Firewall(dataCenterService, policyClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);

        self.Port = Port;
    }

    function createPolicy(command, dataCenter) {
        composeRequest(command);

        return policyClient.createFirewallPolicy(_.omit(command, 'dataCenter'), dataCenter.id);
    }

    function composeRequest(command) {
        convertPorts(command);
        convertIp(command, 'source');
        convertIp(command, 'destination');

        return command;
    }

    function convertPorts(command) {
        if (command.ports) {
            var ports = _.asArray(command.ports);

            command.ports = _.map(ports, function(portConfig) {
                if (portConfig instanceof Object) {
                    return Port.convert(portConfig.protocol, portConfig.port, portConfig.to);
                }
                return portConfig;
            });
        } else {
            command.ports = ['any'];
        }

        return command;
    }

    function convertIp(command, property) {
        if (command[property]) {
            command[property] = new ToCidr(command[property]);
        } else {
            command[property] = [];
        }

        return command;
    }

    function waitUntilPolicyIsConstructed(status) {
        return new CreatePolicyJob(policyClient, extractPolicyInfo(status)).await(2000);
    }

    function extractPolicyInfo(status) {
        var link = _.findWhere(status.links, {rel: 'self'});
        var parts = link.href.split('/');

        return {
            id: parts.pop(),
            dataCenterId: parts.pop()
        };
    }

    /**
     * Method allow to create firewall policy
     *
     * @param {object} command
     * @param {DataCenterCriteria} command.dataCenter - DataCenterCriteria that specify data center
     * @param {string} command.destinationAccount - target policy name
     * @param {Array<string>} command.source - Source addresses for traffic on the originating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} command.destination - Destination addresses for traffic on the terminating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} command.ports - Type of ports associated with the policy.
     * Supported ports include: any, icmp, TCP and UDP with single ports (tcp/123, udp/123)
     * and port ranges (tcp/123-456, udp/123-456).
     * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
     * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
     * May be specified as config object using {@link Port}.
     *
     * @returns {Promise<Array<Reference>>} the array of created policies references
     *
     * @instance
     * @function create
     * @memberof Firewall
     */
    self.create = function (command) {
        return dataCenterService.findSingle(command.dataCenter)
            .then(_.partial(createPolicy, command))
            .then(waitUntilPolicyIsConstructed)
            .then(processPolicyRef);
    };

    function processPolicyRefs(policies) {
        return _.map(policies, processPolicyRef);
    }

    function processPolicyRef(policy) {
        return {id: policy.id};
    }

    function deletePolicy (policyMetadata) {
        return policyClient
            .deleteFirewallPolicy(policyMetadata.id, policyMetadata.dataCenter.id)
            .then(_.partial(processPolicyRef, policyMetadata));
    }

    /**
     * Method allow to delete firewall policy
     * @param {FirewallPolicyCriteria} arguments - criteria that specify set of policies that will be deleted
     *
     * @returns {Promise<Array<Reference>>} the array of deleted policies references
     *
     * @instance
     * @function delete
     * @memberof Firewall
     */
    self.delete = function () {
        var result = self
            .find(arguments)
            .then(_.partial(_.map, _, deletePolicy))
            .then(Promise.all);

        return new NoWaitOperationPromise(null, "Delete Firewall Policy").from(result);
    };

    function modifyPolicies(policies, config) {
        return Promise.all(_.map(policies, function(policy) {
                return policyClient.modifyFirewallPolicy(policy.id, composeRequest(config), policy.dataCenter.id);
            }))
            .then(_.partial(processPolicyRefs, policies));
    }


    /**
     * Method allow to modify policy
     *
     * @param {FirewallPolicyCriteria} policyCriteria - criteria that specify set of policies that will be modified
     *
     * @param {object} config
     * @param {Array<string>} config.source - Source addresses for traffic on the originating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} config.destination - Destination addresses for traffic on the terminating firewall,
     * specified using CIDR notation or using config object with ip and mask properties.
     * @param {Array<string>} config.ports - Type of ports associated with the policy.
     * Supported ports include: any, icmp, TCP and UDP with single ports (tcp/123, udp/123)
     * and port ranges (tcp/123-456, udp/123-456).
     * Some common ports include: tcp/21 (for FTP), tcp/990 (FTPS), tcp/80 (HTTP 80), tcp/8080 (HTTP 8080),
     * tcp/443 (HTTPS 443), icmp (PING), tcp/3389 (RDP), and tcp/22 (SSH/SFTP).
     * May be specified as config object using {@link Port}.
     * @return {Promise<Array<Reference>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     * @instance
     * @function modify
     * @memberof Firewall
     */
    self.modify = function (policyCriteria, config) {
        return self.find(policyCriteria)
            .then(_.partial(modifyPolicies, _, config));
    };

    /**
     * Method allows to search firewall policies.
     *
     * @param {FirewallPolicyCriteria} arguments - criteria that specify set of policies that will be searched
     *
     * @return {Promise<Array<FirewallPolicyMetadata>>} - promise that resolved by list of references to
     *                                            successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Firewall
     */
    self.find = function() {
        var criteria = new PolicyCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            .then(loadDataCenterToPolicies)
            .then(_.flatten)
            .then(_.partial(filterPolicies, criteria));
    };

    function loadDataCenterToPolicies(dataCenters) {
        return Promise.all(_.map(dataCenters, function(dataCenter) {
            return policyClient.findFirewallPolicies(dataCenter.id)
                .then(function(policies) {
                    _.each(policies, function(policy) {
                        policy.dataCenter = dataCenter;
                    });

                    return Promise.resolve(policies);
                });
        }));
    }

    function filterPolicies(criteria, policies) {

        if (!policies || policies.length === 0) {
            return [];
        }
        return _.filter(policies, new PolicyCriteria(criteria).predicate().fn);
    }

    init();
}
},{"./../../../base-services/queue/domain/no-wait-operation-promise.js":12,"./../../../core/search/criteria.js":94,"./../../../core/search/search-support.js":96,"./domain/create-policy-job":52,"./domain/ip-converter":53,"./domain/policy-criteria.js":54,"./domain/port":55,"bluebird":"bluebird","underscore":"underscore"}],58:[function(require,module,exports){
var _ = require('underscore');
var AntiAffinity = require('./anti-affinity/anti-affinity.js');
var Alert = require('./alert/alert.js');
var AutoScale = require('./autoscale/autoscale');
var Firewall = require('./firewall/firewall');

module.exports = Policies;

/**
 * Service that allow to manage policies (anti-affinity, alert etc) in CenturyLink Cloud
 *
 * @param dataCenterService
 * @param policyClient
 * @param queueClient
 * @constructor
 */
function Policies(dataCenterService, policyClient, queueClient) {
    var self = this;

    self.antiAffinity = _.memoize(function () {
        return new AntiAffinity(
            dataCenterService,
            policyClient,
            queueClient
        );
    });

    self.alert = _.memoize(function () {
        return new Alert(
            policyClient,
            queueClient
        );
    });

    self.autoScale = _.memoize(function () {
        return new AutoScale(
            policyClient
        );
    });

    self.firewall = _.memoize(function () {
        return new Firewall(
            dataCenterService,
            policyClient
        );
    });

}
},{"./alert/alert.js":41,"./anti-affinity/anti-affinity.js":44,"./autoscale/autoscale":47,"./firewall/firewall":57,"underscore":"underscore"}],59:[function(require,module,exports){

module.exports = PolicyClient;

function PolicyClient(rest) {
    var self = this;

    self.createAntiAffinityPolicy = function (request) {
        return rest.postJson('/v2/antiAffinityPolicies/{ACCOUNT}/', request);
    };

    self.deleteAntiAffinityPolicy = function (policyId) {
        return rest.delete('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAntiAffinityPolicyById = function (policyId) {
        return rest.get('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAntiAffinityPolicies = function () {
        return rest.get('/v2/antiAffinityPolicies/{ACCOUNT}/');
    };

    self.modifyAntiAffinityPolicy = function (policyId, request) {
        return rest.putJson('/v2/antiAffinityPolicies/{ACCOUNT}/' + policyId, request);
    };


    self.createAlertPolicy = function (request) {
        return rest.postJson('/v2/alertPolicies/{ACCOUNT}/', request);
    };

    self.deleteAlertPolicy = function (policyId) {
        return rest.delete('/v2/alertPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAlertPolicyById = function (policyId) {
        return rest.get('/v2/alertPolicies/{ACCOUNT}/' + policyId);
    };

    self.findAlertPolicies = function () {
        return rest.get('/v2/alertPolicies/{ACCOUNT}/');
    };

    self.modifyAlertPolicy = function (policyId, request) {
        return rest.putJson('/v2/alertPolicies/{ACCOUNT}/' + policyId, request);
    };


    self.findVerticalAutoscalePolicyById = function (policyId) {
        return rest.get('/v2/autoscalePolicies/{ACCOUNT}/' + policyId);
    };

    self.findVerticalAutoscalePolicies = function () {
        return rest.get('/v2/autoscalePolicies/{ACCOUNT}/');
    };


    self.createFirewallPolicy = function (request, dataCenterId) {
        return rest.postJson('/v2-experimental/firewallPolicies/{ACCOUNT}/' + dataCenterId.toUpperCase(), request);
    };

    self.deleteFirewallPolicy = function (policyId, dataCenterId) {
        return rest.delete('/v2-experimental/firewallPolicies/{ACCOUNT}/' + dataCenterId.toUpperCase() + '/' + policyId);
    };

    self.findFirewallPolicyById = function (policyId, dataCenterId) {
        return rest.get('/v2-experimental/firewallPolicies/{ACCOUNT}/' + dataCenterId.toUpperCase() + '/' + policyId);
    };

    self.findFirewallPolicies = function (dataCenterId) {
        return rest.get('/v2-experimental/firewallPolicies/{ACCOUNT}/' + dataCenterId.toUpperCase());
    };

    self.modifyFirewallPolicy = function (policyId, request, dataCenterId) {
        return rest.putJson(
            '/v2-experimental/firewallPolicies/{ACCOUNT}/' + dataCenterId.toUpperCase() + '/' + policyId,
            request
        );
    };


}

},{}],60:[function(require,module,exports){

var Architecture = {
    I386: "32Bit",
    X86_64: "64Bit"
};

module.exports = Architecture;
},{}],61:[function(require,module,exports){

var _ = require('underscore');
var Templates = require('./../../templates/templates.js');
var DiskType = require('./disk-type.js');
var Server = require('./server.js');
var Promise = require('bluebird');

module.exports = CreateServerConverter;

function CreateServerConverter(groups, templates, accountClient, policies) {

    var self = this;

    self._serverService = function(serverService) {
        self.serverService = serverService;
    };

    self.fetchGroupId = function (command) {
        if (!command.groupId && command.group) {
            return groups
                .findSingle(command.group)
                .then(_.property('id'));
        }

        return command.groupId;
    };

    self.loadTemplate = function(command) {
        if (command.template) {
            return templates.findSingle(command.template)
                .then(function(template) {
                    command.fetchedTemplate = template;
                    return command;
                });
        }

        return command;
    };

    self.setManagedOs = function(command) {
        if (command.managedOS === true) {
            if(!hasTemplateCapability(command.fetchedTemplate, "managedOS")) {
                throw new Error("Managed OS capability is not supported by this template");
            }
            command.isManagedOS = true;

        }
        return command;
    };

    function hasTemplateCapability(template, capability) {
        return template.capabilities.indexOf(capability) > -1;
    }

    self.setTemplateName = function (command) {
        var templateName = command.sourceServerId;
        if (!command.sourceServerId && command.fetchedTemplate) {
            templateName = command.fetchedTemplate.name;
        }

        return _.extend(command, {sourceServerId: templateName});
    };

    self.convertDns = function (command) {
        var primaryDns = command.primaryDns ?
            command.primaryDns :
            (command.network ? command.network.primaryDns : undefined);

        var secondaryDns = command.secondaryDns ?
            command.secondaryDns :
            (command.network ? command.network.secondaryDns : undefined);

        return _.extend(command, { primaryDns: primaryDns, secondaryDns: secondaryDns });
    };

    self.convertMachine = function (command) {
        var cpu = command.cpu ?
            command.cpu : command.machine.cpu;

        var memoryGB = command.memoryGB ?
            command.memoryGB : command.machine.memoryGB;

        var additionalDisks = [];

        if (command.machine && command.machine.disks) {
            _.each(command.machine.disks, function(disk) {
                var additionalDisk;

                if (!disk.size) {
                    additionalDisk = { sizeGB: disk, type: DiskType.RAW };
                } else {
                    additionalDisk = {
                        sizeGB: disk.size,
                        type: disk.type ? disk.type : (disk.path ? DiskType.PARTITIONED : DiskType.RAW)
                    };

                    if (disk.path) {
                        additionalDisk.path = disk.path;
                    }
                }

                additionalDisks.push(additionalDisk);
            });
        }

        return _.extend(command, {
            cpu: cpu,
            memoryGB: memoryGB,
            additionalDisks: additionalDisks
        });
    };

    self.convertTtl = function(command) {
        if (command.ttl) {
            var ttl = command.ttl;

            var now = new Date();

            if (typeof ttl === "number") {
                now.setHours(now.getHours() + ttl);
                ttl = now;
            }

            if (ttl.constructor && ttl.constructor.name === "Duration") {
                var addSeconds = ttl.as('seconds');
                now.setSeconds(now.getSeconds() + addSeconds);
                ttl = now;
            }

            if (isNaN(Date.parse(new Date(ttl)))) {
                throw new Error('Please specify ttl in correct format. See documentation for details');
            }

            if (typeof ttl === "string") {
                ttl = new Date(ttl);
            }

            command.ttl = ttl.toISOString();
        }

        return command;
    };

    self.setHyperscaleServer = function(command) {
        if (command.type === Server.HYPERSCALE) {
            if(!hasTemplateCapability(command.fetchedTemplate, "hyperscale")) {
                throw new Error("Hyperscale capability is not supported by this template");
            }
            command.storageType = Server.StorageType.HYPERSCALE;

        }
        return command;
    };

    self.setPolicies = function(command) {
        if (command.machine) {
            return setAntiAffinityPolicy(command)
                .then(setAutoScalePolicy);
        }
        return command;
    };

    function setAntiAffinityPolicy(command) {
        var antiAffinity = command.machine.antiAffinity;
        if (antiAffinity) {
            var dataCenter = (command.group && command.group.dataCenter) ||
                (command.template && command.template.dataCenter);

            antiAffinity.dataCenter = antiAffinity.dataCenter || dataCenter;

            return policies.antiAffinity()
                .findSingle(antiAffinity)
                .then(function(policy) {
                    return _.extend(command, {antiAffinityPolicyId: policy.id});
                });
        }

        return Promise.resolve(command);
    }

    function setAutoScalePolicy(command) {
        if (command.machine.autoScale) {
            return setVerticalAutoScalePolicy(command)
                .then(setHorizontalAutoScalePolicy);
        }

        return Promise.resolve(command);
    }

    function setVerticalAutoScalePolicy(command) {
        var vertical = command.machine.autoScale.vertical;
        if (vertical) {
            return policies.autoScale().vertical()
                .findSingle(vertical)
                .then(function(policy) {
                    return _.extend(command, {cpuAutoscalePolicyId: policy.id});
                });
        }

        return Promise.resolve(command);
    }

    function setHorizontalAutoScalePolicy(command) {
        return Promise.resolve(command);
    }

    self.setDefaultValues = function(command) {
        command.type = command.type || Server.STANDARD;
        command.storageType = command.storageType || Server.StorageType.STANDARD;

        return command;
    };

    self.clearConfig = function(command) {
        return _.omit(command, "machine", "group", "template", "managedOS", "policy", "fetchedTemplate", "network");
    };

    self.convertServerAttributesToClone = function (command) {
        return self.serverService
            .findSingle(command.from.server)
            .then(function(server) {
                command.sourceServerId = server.id;
                return self.serverService.findCredentials(server);
            })
            .then(function(credentials) {
                command.sourceServerPassword = credentials.password;
                return command;
            });
    };

    self.convertServerAttributesToImport = function (command) {
        return _.extend(command, {
            ovfId: command.ovf.id,
            ovfOsType: command.ovf.osType
        });
    };


    self.convertCustomFields = function(command) {
        if (command.customFields) {
            return accountClient.getCustomFields()
                .then(_.partial(filterCustomFields, command))
                .then(_.partial(composeCustomFields, command));
        }

        return command;
    };

    function filterCustomFields(command, availableFields) {
        var filteredFields = _.map(command.customFields, function(criteria) {
                var byName = _.filter(availableFields, function(field) {
                    return field.name === criteria.name;
                });
                var byFunction = criteria.where ? _.filter(availableFields, criteria.where) : [];
                return _.asArray(byName, byFunction);
            }
        );
        return _.chain(filteredFields)
            .flatten()
            .uniq(function(field) {
                return field.id;
            })
            .value();
    }

    function composeCustomFields(command, filteredFields) {
        command.customFields = _.map(filteredFields, function(field) {
            return {
                id: field.id,
                value: _.find(command.customFields, function(criteria) {
                    return criteria.name === field.name || criteria.where(field);
                }).value
            };
        });
        return command;
    }
}
},{"./../../templates/templates.js":82,"./disk-type.js":62,"./server.js":67,"bluebird":"bluebird","underscore":"underscore"}],62:[function(require,module,exports){

var DiskType = {
    RAW: "raw",
    PARTITIONED: "partitioned"
};

module.exports = DiskType;
},{}],63:[function(require,module,exports){

var Port = {
    HTTP: 80,
    HTTPS: 443,
    SSH: 22,
    RDP: 3389,
    FTP: 21

};

module.exports = Port;
},{}],64:[function(require,module,exports){

var Protocol = {
    TCP: 'TCP',
    UDP: 'UDP',
    ICMP: 'ICMP'

};

module.exports = Protocol;
},{}],65:[function(require,module,exports){

var _ = require('underscore');
var IpSubnetCalculator = require('ip-subnet-calculator');
var Protocol = require('./protocol.js');

module.exports = PublicIpConverter;

function PublicIpConverter() {

    var self = this;

    self.convert = function(publicIpConfig) {
        var ports = _.map(publicIpConfig.openPorts, fetchPort);
        var sourceRestrictions = _.map(publicIpConfig.sourceRestrictions, fetchRestriction);

        var result = {
            ports: ports,
            sourceRestrictions: sourceRestrictions
        };

        if (publicIpConfig.internalIPAddress) {
            result.internalIPAddress = publicIpConfig.internalIPAddress;
        }

        return result;
    };

    function fetchPort(data) {
        var result = {
            protocol: data.protocol ? data.protocol : Protocol.TCP,
            port: data instanceof Object ? ( data.port ? data.port : data.from ) : data
        };

        if (data.to) {
            result.portTo = data.to;
        }

        return result;
    }

    function fetchRestriction(data) {
        var cidr = data;

        if (data instanceof Object) {
            var subnet = IpSubnetCalculator.calculateCIDRPrefix(data.ip, data.mask);
            cidr = subnet.ipLowStr + '/' + subnet.prefixSize;
        }

        return { cidr: cidr };
    }
}
},{"./protocol.js":64,"ip-subnet-calculator":"ip-subnet-calculator","underscore":"underscore"}],66:[function(require,module,exports){

var SingleServerCriteria = require('./single-server-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = ServerCriteria;

/**
 * Class that used to filter servers
 * @typedef ServerCriteria
 * @type {(SingleServerCriteria|CompositeCriteria)}
 *
 */
function ServerCriteria (criteria) {
    return new SearchCriteria(criteria, SingleServerCriteria);

}
},{"./../../../core/search/common-criteria.js":92,"./single-server-criteria.js":68}],67:[function(require,module,exports){
var Port = require('./port.js');
var Protocol = require('./protocol.js');

var Server = {

    STANDARD: 'standard',
    HYPERSCALE: 'hyperscale',

    Port: Port,
    Protocol: Protocol,

    StorageType: {
        STANDARD: 'standard',
        PREMIUM: 'premium',
        HYPERSCALE: 'hyperscale'
    }


};

module.exports = Server;
},{"./port.js":63,"./protocol.js":64}],68:[function(require,module,exports){

var _ = require('underscore');
var Predicate = require('./../../../core/predicates/predicates.js');
var GroupCriteria = require('./../../groups/domain/group-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleServerCriteria;


/**
 * The type of {@link ServerCriteria} that represents single search criteria.
 * <br/>Note: If you provide <b>dataCenter</b> search criteria and the properties
 * <b>dataCenterId, dataCenterName, dataCenterNameContains</b> -
 * the OR criteria will be applied.
 *
 * @typedef SingleServerCriteria
 * @type {object}
 *
 * @property {string} id - a server id restriction.
 * @property {string} name - a server name restriction.
 * @property {string} nameContains - restriction that pass only servers which name contains specified keyword.
 * @property {string} descriptionContains - restriction that pass only servers which description contains specified keyword.
 * @property {function} where - restriction that pass only server which data match function logic.
 * @property {DataCenterCriteria} dataCenter - restrict data centers in which need to execute search.
 * @property {GroupCriteria} group - restrict groups in which need to execute search.
 * @property {Boolean} onlyActive - restriction that pass only active servers .
 * @property {Array<string>} powerStates - restriction that pass only servers in specified power state.
 *
 * @property {string} dataCenterId - a data center id restriction.
 * @property {string} dataCenterName - a data center name restriction.
 * @property {string} dataCenterNameContains - restriction that pass only server which data center name contains specified keyword.
 *
 * @example data center criteria
 * {or:
 *      dataCenter,
 *      {
 *          id: dataCenterId,
 *          name: dataCenterName,
 *          nameContains: dataCenterNameContains
 *      }
 * }
 *
 * @example server criteria
 * {
 *     nameContains:'web',
 *     onlyActive: true,
 *     powerStates: ['started'],
 *     dataCenter: [{id : 'ca1'}],
 *     dataCenterId: 'de1',
 *     dataCenterName: DataCenter.DE_FRANKFURT.name,
 *     group: {name: 'Default Group'}
 * }
 */
function SingleServerCriteria(criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(new GroupCriteria(criteria).parseCriteria());
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'group';

        self.criteriaPropertiesMap = {
            id: 'groupId',
            name: 'groupName',
            nameContains: 'groupNameContains',
            dataCenter: 'dataCenter'
        };
    }

    function filterActive() {
        return criteria.onlyActive && Predicate.equalTo("active", "status") ||
                Predicate.alwaysTrue();
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(GroupCriteria, 'group')
                .and(filters.byId())
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name'))
                .and(filters.byParamMatch('descriptionContains', 'description'))
                .and(filters.byParamAnyOf('powerStates', 'details.powerState'))

                .and(filterActive()),
            path
        );
    };

    self.parseCriteria = function () {
        var parsedCriteria = criteriaHelper.parseSingleCriteria(self);

        if (_.isEmpty(parsedCriteria.group)) {
            delete parsedCriteria.group;
        }

        return parsedCriteria;
    };

    init();
}
},{"./../../../core/predicates/predicates.js":91,"./../../../core/search/criteria.js":94,"./../../groups/domain/group-criteria.js":28,"underscore":"underscore"}],69:[function(require,module,exports){
var _ = require('underscore');
var Promise = require("bluebird");
var SSH = require("simple-ssh");


var events = require('events');
var EventEmitter = events.EventEmitter;

module.exports = SshClient;

/**
 * The SSH client
 * @param initPromise initial promise, that loads IP, credentials, server info for a requested servers
 * @constructor
 *
 * @example
 *
 * compute.servers()
 *      .execSsh(server)
 *      .run(['cd ~;ls', 'ls -l', 'ls -all']).then(processSuccess, processErrors)
 *      .run('ls -all').then(processSuccess);
 */
function SshClient(initPromise) {
    var self,
        clients,
        emitterMethods = ['on', 'emit'],
        serverProps;

    var defaultTimeout = 99999;

    function getPromise() {
        var emitter = new EventEmitter();
        var promise = new Promise(function (resolve, reject) {
            emitter.on('complete', function (result) {
                resolve(result);
            });

            emitter.on('error', function (errors) {
                reject(errors);
            });
        });

        _.each(emitterMethods, function(method) {
            promise[method] = _.bind(emitter[method], emitter);
        });

        promise.executedCommands = 0;
        promise.results = [];
        promise.errors = [];

        return promise;
    }

    function init() {
        self = initPromise.then(initClient);

        self.thenPromise = self.then;
    }

    init();

    function initClient(props) {
        serverProps = props;
    }

    function setupClients() {
        clients = _.map(serverProps, function(opts) {

            var sshClient = new SSH({
                host: opts.ipAddress.publicIPAddress,
                user: opts.credentials.userName,
                pass: opts.credentials.password,
                timeout: defaultTimeout
            });
            sshClient.server = opts.server;

            return sshClient;
        });
    }

    /**
     * Method allows execute commands provided as array or string.
     *
     * @param commands {String|Array<String>} the command name
     * @returns {SshClient}
     *
     * @memberof SshClient
     * @instance
     * @function run
     */
    self.run = function(commands) {

        self = self.then(execCommand(commands));

        return self;
    };

    /**
     * The Promise.then wrapper function.<br/>
     * The first param in processSuccess and processErrors will be in format:
     * <br/>{
     * <br/>     server: serverId,
     * <br/>     result: the array of output for each command
     * <br/>}
     * @param processSuccess {function} the successful promise handler
     * @param processErrors {function} the failure promise handler
     * @returns {SshClient}
     *
     * @memberof SshClient
     * @instance
     * @function then
     *
     * @example
     * [
     *     {
     *       "server": "de1altdweb598",
     *       "results": [
     *         {
     *           "cmd": "ls",
     *           "result": "anaconda-ks.cfg\ninstall.log\ninstall.log.syslog\n"
     *         }
     *       ]
     *     }
     * ]
     */
    self.then = function(processSuccess, processErrors) {

        self = self.thenPromise(processSuccess, processErrors);

        self.run = this.run;
        self.thenPromise = self.then;
        self.then = this.then;

        return self;
    };

    function execCommand(commands) {
        return function() {
            setupClients();
            return Promise.all(_.map(clients, function(client) {
                return execute(client, commands);
            }));
        };
    }

    function execute(client, commands) {
        var allCommands = splitCommands(commands),
            clientPromise = getPromise();

        _.each(allCommands, function(command) {
            client.exec(command, {
                out: handleEvent(command, clientPromise, "complete"),
                err: handleEvent(command, clientPromise, "error"),
                exit: function() {
                    clientPromise.executedCommands++;

                    if (clientPromise.executedCommands === allCommands.length) {
                        if (clientPromise.errors.length > 0) {
                            clientPromise.emit('error',
                                {
                                    server: client.server.id,
                                    results: clientPromise.errors
                                }
                            );
                            return;
                        }
                        clientPromise.emit('complete',
                            {
                                server: client.server.id,
                                results: clientPromise.results
                            }
                        );
                    }
                }
            });
        });

        client.start({
            fail: function(err) {
                console.error("Cannot connect to " + client.server.id);
                console.error(err);
            }
        });

        return clientPromise;
    }

    function splitCommands(commands) {
        return _.chain(_.asArray(commands))
            .map(function(command) {
                return command.split(";");
            })
            .flatten()
            .value();
    }

    function handleEvent(command, promise, event) {

        return function(result) {
            var resultObj = {
                cmd: command,
                result: result
            };

            if (event === 'complete') {
                promise.results.push(resultObj);
            } else {
                promise.errors.push(resultObj);
            }
        };
    }

    return self;
}
},{"bluebird":"bluebird","events":"events","simple-ssh":"simple-ssh","underscore":"underscore"}],70:[function(require,module,exports){


module.exports = ServerClient;

function ServerClient (client) {
    var self = this;

    function init () {
    }

    self.findServerById = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId);
    };

    self.findServerByUuid = function (serverUuid) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverUuid + '?uuid=True');
    };

    self.createServer = function (createServerRequest) {
        return client.postJson('/v2/servers/{ACCOUNT}/', createServerRequest);
    };

    self.cloneServer = function (cloneServerRequest) {
        return client.postJson('/v2/servers/{ACCOUNT}/', cloneServerRequest);
    };

    self.deleteServer = function (serverId) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId);
    };

    self.findAvailableServerImports = function (dataCenterId) {
        return client.get('/v2/vmImport/{ACCOUNT}/' + dataCenterId + '/available');
    };

    self.findServerCredentials = function (serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId + '/credentials');
    };

    self.importServer = function (importServerRequest) {
        return client.postJson('/v2/vmImport/{ACCOUNT}/', importServerRequest);
    };

    self.modifyServer = function(serverId, modifyServerRequest) {
        return client.patchJson(
            '/v2/servers/{ACCOUNT}/' + serverId,
            modifyServerRequest
        );
    };

    self.powerOperation = function(operationName, serverIds) {
        return client.postJson(
            '/v2/operations/{ACCOUNT}/servers/' + operationName,
            serverIds
        );
    };

    self.restore = function(serverId, request) {
        return client.postJson(
            '/v2/servers/{ACCOUNT}/' + serverId + "/restore",
            request
        );
    };

    self.addPublicIp = function(serverId, request) {
        return client.postJson(
            '/v2/servers/{ACCOUNT}/' + serverId + '/publicIPAddresses',
            request
        );
    };

    self.getPublicIp = function (serverId, publicIp) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId + '/publicIPAddresses/' + publicIp);
    };

    self.removePublicIp = function (serverId, publicIp) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId + '/publicIPAddresses/' + publicIp);
    };

    self.modifyPublicIp = function (serverId, publicIp, request) {
        return client.putJson(
            '/v2/servers/{ACCOUNT}/' + serverId + '/publicIPAddresses/' + publicIp,
            request
        );
    };

    self.createSnapshot = function(request) {
        return client.postJson('/v2/operations/{ACCOUNT}/servers/createSnapshot',request);
    };

    self.revertToSnapshot = function(serverId, snapshotId) {
        return client.postJson('/v2/servers/{ACCOUNT}/' + serverId + '/snapshots/' + snapshotId + '/restore');
    };

    self.deleteSnapshot = function(serverId, snapshotId) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId + '/snapshots/' + snapshotId);
    };

    self.getPolicy = function(serverId, policyName) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId + '/' + policyName);
    };

    self.addSecondaryNetwork = function (serverId, addNetworkRequest) {
        return client.postJson('/v2/servers/{ACCOUNT}/' + serverId + '/networks', addNetworkRequest);
    };

    self.removeSecondaryNetwork = function (serverId, networkId) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId + '/networks/' + networkId);
    };

    self.getInvoice = function(year, month, pricingAccountAlias) {
        var url = '/v2/invoice/{ACCOUNT}/' + year + '/' + month;

        if (pricingAccountAlias) {
            url += '?pricingAccountAlias=' + pricingAccountAlias;
        }

        return client.get(url);
    };

    self.setAutoScalePolicy = function(serverId, policyId) {
        return client.putJson('/v2/servers/{ACCOUNT}/' + serverId.toUpperCase() + '/cpuAutoscalePolicy', {id: policyId});
    };

    self.removeAutoScalePolicy = function(serverId) {
        return client.delete('/v2/servers/{ACCOUNT}/' + serverId.toUpperCase() + '/cpuAutoscalePolicy');
    };

    self.getAutoScalePolicy = function(serverId) {
        return client.get('/v2/servers/{ACCOUNT}/' + serverId.toUpperCase() + '/cpuAutoscalePolicy');
    };

    init();
}

},{}],71:[function(require,module,exports){

var _ = require('underscore');
var Promise = require("bluebird");
var OperationPromise = require('./../../base-services/queue/domain/operation-promise.js');
var CreateServerJob = require('./../../base-services/queue/domain/create-server-job.js');
var SshClient = require('./domain/ssh-client.js');
var Server = require('./domain/server.js');

var Criteria = require('./../../core/search/criteria.js');
var ServerCriteria = require('./domain/server-criteria');
var PublicIpConverter = require('./domain/public-ip-converter.js');
var SearchSupport = require('./../../core/search/search-support.js');
var IpAddressDetails = require('./../networks/domain/ip-address-details');

/**
 * @typedef Reference
 * @type {object}
 * @property {string} id - an ID.
 */

module.exports = Servers;

/**
 * @typedef ServerMetadata
 * @type {object}
 * @property {string} id - ID of the server being queried.
 * @property {string} name - Name of the server
 * @property {string} description - User-defined description of this server
 * @property {string} groupId - ID of the parent group
 * @property {boolean} isTemplate - Boolean indicating whether this is a custom template or running server
 * @property {string} locationId - Data center that this server resides in
 * @property {string} osType - Friendly name of the Operating System the server is running
 * @property {string} status - Describes whether the server is active or not
 * @property {Array<DetailsMetadata>} details - Resource allocations, alert policies, snapshots, and more
 * @property {string} type - Whether a standard or premium server
 * @property {string} storageType - Whether it uses standard or premium storage
 * @property {Array} changeInfo - Describes "created" and "modified" details
 * @property {Array} links - Collection of entity links that point to resources related to this server
 *
 * @example
 * {
 *  "id": "WA1ALIASWB01",
 *  "name": "WA1ALIASWB01",
 *  "description": "My web server",
 *  "groupId": "2a5c0b9662cf4fc8bf6180f139facdc0",
 *  "isTemplate": false,
 *  "locationId": "WA1",
 *  "osType": "Windows 2008 64-bit",
 *  "status": "active",
 *  "details": {
 *    "ipAddresses": [
 *      {
 *        "internal": "10.82.131.44"
 *      },
 *      {
 *        "public": "91.14.111.101",
 *        "internal": "10.82.131.45"
 *      }
 *    ],
 *    "alertPolicies": [
 *      {
 *        "id": "15836e6219e84ac736d01d4e571bb950",
 *        "name": "Production Web Servers - RAM",
 *        "links": []
 *      },
 *      {
 *        "id": "2bec81dd90aa4217887548c3c20d7421",
 *        "name": "Production Web Servers - Disk",
 *        "links": []
 *      }
 *    ],
 *    "cpu": 2,
 *    "diskCount": 1,
 *    "hostName": "WA1ALIASWB01.customdomain.com",
 *    "inMaintenanceMode": false,
 *    "memoryMB": 4096,
 *    "powerState": "started",
 *    "storageGB": 60,
 *    "disks":[
 *      {
 *        "id":"0:0",
 *        "sizeGB":60,
 *        "partitionPaths":[]
 *      }
 *    ],
 *    "partitions":[
 *      {
 *        "sizeGB":59.654,
 *        "path":"C:\\"
 *      }
 *    ],
 *    "snapshots": [
 *      {
 *        "name": "2014-05-16.23:45:52",
 *        "links": []
 *       }
 *     ],
 *     "customFields": [
 *       {
 *         "id": "22f002123e3b46d9a8b38ecd4c6df7f9",
 *         "name": "Cost Center",
 *         "value": "IT-DEV",
 *         "displayValue": "IT-DEV"
 *       },
 *       {
 *         "id": "58f83af6123846769ee6cb091ce3561e",
 *         "name": "CMDB ID",
 *         "value": "1100003",
 *         "displayValue": "1100003"
 *       }
 *     ]
 *   },
 *   "type": "standard",
 *   "storageType": "standard",
 *   "changeInfo": {
 *     "createdDate": "2012-12-17T01:17:17Z",
 *     "createdBy": "user@domain.com",
 *    "modifiedDate": "2014-05-16T23:49:25Z",
 *    "modifiedBy": "user@domain.com"
 *  },
 *  "links": []
 * }
 */
/**
 * @typedef DetailsMetadata
 * @type {object}
 * @property {Array} ipAddresses - Details about IP addresses associated with the server
 * @property {Array} alertPolicies - Describe each alert policy applied to the server
 * @property {int} cpu - How many vCPUs are allocated to the server
 * @property {int} diskCount - How many disks are attached to the server
 * @property {string} hostName - Fully qualified name of the server
 * @property {boolean} inMaintenanceMode - Indicator of whether server has been placed in maintenance mode
 * @property {int} memoryMB - How many MB of memory are allocated to the server
 * @property {string} powerState - Whether the server is running or not
 * @property {int} storageGB - How many total GB of storage are allocated to the server
 * @property {Array} disks - The disks attached to the server
 * @property {Array} partitions - The partitions defined for the server
 * @property {Array} snapshots - Details about any snapshot associated with the server
 * @property {Array} customFields - Details about any custom fields and their values
 * @property {Array} processorDescription - Processor configuration description (for bare metal servers only)
 * @property {Array} storageDescription - Storage configuration description (for bare metal servers only)
 */

/**
 * The service that works with servers
 * @param {ServerClient} serverClient server REST client
 * @param {CreateServerConverter} serverConverter server converter
 * @param {QueueClient} queueClient queue REST client
 * @param {Groups} groupService group service
 * @param {Networks} networkService
 * @param {ExperimentalQueueClient} experimentalQueueClient
 * @param {Policies} policyService
 * @constructor
 */
function Servers(serverClient, serverConverter, queueClient, groupService, networkService, experimentalQueueClient,
                policyService) {
    var self = this;

    function init () {
        SearchSupport.call(self);
        serverConverter._serverService(self);
    }

    function initCriteria() {
        return new ServerCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();
    }

    function preprocessResult(list) {
        return (list.length === 1) ? list[0] : list;
    }

    function findByRef() {
        var promises = _.chain([arguments])
            .flatten()
            .map(function (reference) {
                return serverClient.findServerById(reference.id);
            })
            .value();

        return Promise.all(promises).then(preprocessResult);
    }

    /**
     * Method allows to find server by uuid.
     * @param uuid {String} the server uuid
     * @returns {Promise<ServerMetadata>}
     *
     * @memberof Servers
     * @instance
     * @function findByUuid
     */
    self.findByUuid = function(uuid) {
        return serverClient
            .findServerByUuid(uuid)
            .then(preprocessResult);
    };

    /**
     * Method allows to search servers.
     *
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be searched
     *
     * @return {Promise<Array<ServerMetadata>>} - promise that resolved by list of references to
     * successfully processed resources.
     *
     * @instance
     * @function find
     * @memberof Servers
     */
    self.find = function() {
        var criteria = initCriteria(arguments);

        var groupCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.group;
        });

        var filteredByDataCenterPromise;
        if (!groupCriteria) {
            filteredByDataCenterPromise = Promise.resolve([]);
        } else {
            filteredByDataCenterPromise = groupService.find(groupCriteria);
        }

        return filteredByDataCenterPromise
            .then(loadServerDetails)
            .then(getServers)
            .then(_.partial(loadServersById, criteria))
            .then(_.flatten)
            .then(_.partial(filterServers, criteria));
    };

    function loadServerDetails(groups) {
        return Promise.all(
            _.map(groups, function(group) {
                return groupService._findByRef(group, true)
                    .then(function(groupWithServers) {
                        groupWithServers.dataCenter = group.dataCenter;
                        return groupWithServers;
                    });
            })
        );
    }

    function getServers(groups) {
        return _.chain(
            _.map(groups, function(group) {
                return group.getAllServers();
            }))
            .flatten()
            .uniq(getServerId)
            .value();
    }

    function loadServersById(criteria, servers) {
        var allIds = new Criteria(criteria).extractIdsFromCriteria();
        if (!_.isEmpty(allIds)) {
            return Promise.join(
                Promise.all(
                    _.map(_.asArray(allIds), function(serverId) {
                        return findByRef({id: serverId});
                    })),
                servers
            );
        } else {
            return servers;
        }
    }

    function filterServers(criteria, servers) {
        if (!servers || servers.length === 0) {
            return [];
        }
        return _.filter(servers, new ServerCriteria(criteria).predicate().fn);
    }

    function resolveServerId(response) {
        return self
            .findByUuid(_.findWhere(response.links, {rel: "self"}).id)
            .then(metadataToRef);
    }

    function metadataToRef(metadata) {
        return { id: metadata.id };
    }

    function composeCreateServerPromise(command) {
        return Promise.resolve(command)
            .then(serverConverter.fetchGroupId)
            .then(_.partial(setGroupIdToCommand, command))
            .then(serverConverter.loadTemplate)
            .then(serverConverter.setManagedOs)
            .then(serverConverter.setHyperscaleServer)
            .then(serverConverter.setTemplateName)
            .then(serverConverter.convertDns)
            .then(serverConverter.convertMachine)
            .then(serverConverter.convertCustomFields)
            .then(serverConverter.convertTtl)
            .then(serverConverter.setPolicies)
            .then(serverConverter.setDefaultValues)
            .then(serverConverter.clearConfig);
    }

    /**
     * Creates a new server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise<Reference>} the promise with created server reference
     *
     * @memberof Servers
     * @instance
     * @function create
     */
    self.create = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId, "Create Server");

        composeCreateServerPromise(command)
            .then(function(request) {
                return serverClient
                    .createServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        if (command.managedOS === true || command.type === Server.HYPERSCALE) {
            promise.addJobFn(waitUntilServerIsConstructed());
        }

        if (command.publicIp) {
            promise.addJobFn(waitUntilPublicIpIsAdded(command));
        }

        return promise;
    };

    function waitUntilPublicIpIsAdded(command) {
        return function(server) {
            return self.addPublicIp(server, command.publicIp);
        };
    }

    function waitUntilServerIsConstructed() {
        return function(server) {
            return new CreateServerJob(serverClient, server);
        };
    }

    /**
     * Clone created server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise<Reference>} the promise with created server reference
     *
     * @memberof Servers
     * @instance
     * @function clone
     */
    self.clone = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId, "Clone Server");

        composeCreateServerPromise(command)
            .then(serverConverter.convertServerAttributesToClone)
            .then(function(request) {
                return serverClient
                    .cloneServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    function setGroupIdToCommand(command, groupId) {
        if (groupId) {
            return _.extend(command, {groupId: groupId});
        }
        return command;
    }

    function composeModifyPasswordConfig(command) {
        if (command.password !== undefined) {
            if (command.currentPassword === command.password) {
                delete command.password;
                delete command.currentPassword;
            } else {
                command.password = {
                    current: command.currentPassword,
                    password: command.password
                };
            }
        }
    }

    function composeModifyDisksConfig(command) {
        if (command.disks) {

            command.disks = _.chain(configureDiskConfig(command))
                .flatten()
                .each(function(cfg) {
                    if (cfg.id) {
                        cfg.diskId = cfg.id;
                        delete cfg.id;
                    }
                    if (cfg.size) {
                        cfg.sizeGB = cfg.size;
                        delete cfg.size;
                    }
                    delete cfg.partitionPaths;
                })
                .uniq(function(cfg) {
                    return cfg.diskId;
                })
                .value();
        }
    }

    function configureDiskConfig(command) {
        var serverData = command.serversData;
        var diskConfig = _.chain(serverData).map(_.property("disks")).flatten().value();

        //disk config provided as array - no conversion needed
        if (!(command.disks instanceof Array)) {
            var newDiskCfg = command.disks;

            if (newDiskCfg.add) {
                var toAdd = _.asArray(newDiskCfg.add);
                diskConfig = diskConfig.concat(toAdd);
            }

            if (newDiskCfg.remove) {
                var toRemove = _.asArray(newDiskCfg.remove);
                diskConfig = _.filter(diskConfig, function(disk) {
                    return toRemove.indexOf(disk.id) === -1;
                });
            }

            if (newDiskCfg.edit) {
                var toEdit = _.asArray(newDiskCfg.edit);

                _.each(diskConfig, function(srvDisk) {
                    var diskCfg = _.findWhere(toEdit, {id: srvDisk.id});

                    if (diskCfg) {
                        srvDisk.size = diskCfg.size;
                    }
                });
            }
        }

        return diskConfig;
    }

    function composeModifyServerPromise(command) {
        return Promise.resolve(command)
            .then(serverConverter.fetchGroupId)
            .then(_.partial(setGroupIdToCommand, command))
            .then(serverConverter.convertCustomFields)
            .then(function(command) {
                var updateProperties = ['description', 'groupId', 'cpu', 'memory', 'disks', 'password', 'customFields'];

                composeModifyPasswordConfig(command);

                composeModifyDisksConfig(command);

                var updateConfig = _.chain(updateProperties)
                    .map(function(property) {
                        if(command[property]) {
                            return {
                                op: 'set',
                                member: property,
                                value: command[property]
                            };
                        }
                    })
                    .compact()
                    .value();

                return {
                    serverId: command.serverId,
                    config: updateConfig
                };
            });
    }

    function composeModifyServersRequest(command) {
        return Promise.all(_.map(command.serversData, function(data) {
            var cmd = _.extend(
                _.clone(command),
                {
                    serverId: data.id,
                    currentPassword: data.credentials.password
                });

            return composeModifyServerPromise(cmd);
        }));
    }

    /**
     * Modify servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers that will be modified
     * @param {ModifyServerConfig} command the server modify config
     * @returns {Promise<Reference>} the promise with modified server references
     *
     * @memberof Servers
     * @instance
     * @function modify
     */
    self.modify = function (searchCriteria, command) {

        var result = self.find(searchCriteria)
            .then(function(servers) {
                return Promise.all(_.map(servers, function(srv) {
                    return Promise.props({
                        id: srv.id,
                        disks: srv.details.disks,
                        credentials: self.findCredentials({id: srv.id})
                    });
                }));
            })
            .then(function(serversData) {
                command.serversData = serversData;
                return command;
            })
            .then(composeModifyServersRequest)
            .then(_.partial(modify, command))
            .then(Promise.settle);

        return new OperationPromise(
            queueClient,
            function() {
                return _.map(command.serversData, _.partial(_.omit, _, 'disks', 'credentials'));
            },
            "Modify Server"
        ).fromInspections(result);
    };

    function modify(command, requests) {
        var promises =
            _.chain(requests)
            .map(function(req) {
                return [modifyServer(req), setAutoScale(req, command.autoScale && command.autoScale.vertical)];
            })
            .flatten()
            .value();

        return Promise.all(promises).then(_.compact);
    }

    function setAutoScale(request, autoScalePolicyCriteria) {
        if (autoScalePolicyCriteria) {
            return self.setAutoScalePolicy({id: request.serverId}, autoScalePolicyCriteria)
                .then(_.noop);
        }
    }

    function modifyServer(request) {
        return serverClient.modifyServer(request.serverId, request.config);
    }

    /**
     * Deletes a server.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be deleted
     * @returns {Promise<Reference>} the promise with deleted server references
     *
     * @memberof Servers
     * @instance
     * @function delete
     */
    self.delete = function () {
        var result = self
            .find(self._searchCriteriaFrom(arguments))
            .then(function (servers) {
                return Promise.settle(_.map(servers, deleteServer));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Delete Server").fromInspections(result);
    };

    function deleteServer(serverMetadata) {
        return serverClient
            .deleteServer(serverMetadata.id)
            .then(function (jobInfo) {
                jobInfo.server = serverMetadata.id;
                return jobInfo;
            });
    }

    /**
     * Method returns credentials of single server specified by search criteria
     * @params {ServerSearchCriteria} criteria that allow to specify target single server
     *
     * @returns {Promise} Credentials data for specified server
     */
    self.findCredentials = function () {
        var criteria = self._searchCriteriaFrom(arguments);

        return Promise
            .resolve(criteria)
            .then(self.findSingle)
            .then(getServerId)
            .then(serverClient.findServerCredentials);
    };

    function getServerId (metadata) {
        return metadata.id;
    }

    /**
     * Import server.
     * @param {CreateServerConfig} command the server creation config
     * @returns {Promise<Reference>} the promise with imported server reference
     *
     * @memberof Servers
     * @instance
     * @function import
     */
    self.import = function (command) {
        var promise = new OperationPromise(queueClient, resolveServerId, "Import Server");

        composeCreateServerPromise(command)
            .then(serverConverter.convertServerAttributesToImport)
            .then(function(request) {
                return serverClient
                    .importServer(request)
                    .then(promise.resolveWhenJobCompleted, promise.processErrors);
            });

        return promise;
    };

    /**
     * Power on servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be started
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function powerOn
     */
    self.powerOn = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "powerOn");
    };

    /**
     * Power off servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be stopped
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function powerOff
     */
    self.powerOff = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "powerOff");
    };

    /**
     * Pause servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be paused
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function pause
     */
    self.pause = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "pause");
    };

    /**
     * Start maintenance servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be processed
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function startMaintenance
     */
    self.startMaintenance = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "startMaintenance");
    };

    /**
     * Stop maintenance servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be processed
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function stopMaintenance
     */
    self.stopMaintenance = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "stopMaintenance");
    };


    /**
     * Shut down servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be shut downed
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function shutDown
     */
    self.shutDown = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "shutDown");
    };

    /**
     * Reboot servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be rebooted
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function reboot
     */
    self.reboot = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "reboot");
    };

    /**
     * Reset servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be reseted
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function reset
     */
    self.reset = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "reset");
    };

    /**
     * Archive servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers that will be archived
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function archive
     */
    self.archive = function() {
        var criteria = initCriteria(arguments);

        return sendPowerOperationRequest(criteria, "archive");
    };

    /**
     * Restore servers to group.
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers that will be restored
     * @param {GroupCriteria} groupCriteria - criteria that specify group, in that will be server restored
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function restore
     */
    self.restore = function(serverCriteria, groupCriteria) {
        serverCriteria = initCriteria(serverCriteria);

        var result = self.find(serverCriteria)
            .then(function(servers) {
                return Promise.props({
                    serverIds: extractServerIdFromMetadataList(servers),
                    targetGroup: getGroupId(groupCriteria)
                });
            })
            .then(function(result) {
                return Promise.settle(_.map(result.serverIds, _.partial(restore, _, result.targetGroup)));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Restore Server").fromInspections(result);

    };

    function restore(serverId, groupId) {
        return serverClient.restore(serverId, {targetGroupId: groupId})
            .then(function(status) {
                return Promise.resolve(_.extend(status, {server: serverId}));
            });
    }

    function sendPowerOperationRequest(criteria, operation) {
        var result = self.find(criteria)
            .then(extractServerIdFromMetadataList)
            .then(function(serverIds) {
                return serverClient.powerOperation(operation, serverIds);
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Power operation: " + operation).from(result);
    }

    function extractServerIdFromMetadataList(servers) {
        return _.map(servers, function(server) {
            return server.id.toUpperCase();
        });
    }

    function getGroupId(groupCriteria) {
        return groupService.findSingle(groupCriteria)
            .then(_.property('id'));
    }

    function extractServerIdsFromStatus(jobInfoList) {
        return jobInfoList.map(function (curInfo) {
            return { id: curInfo.server };
        });
    }

    /**
     * Create snapshot for servers.
     * @param {ServerCriteria} serverCriteria - criteria that specify set of servers to perform create snapshot operation on.
     * @param {Number} expirationDays - Number of days to keep the snapshot for (must be between 1 and 10).
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function createSnapshot
     */
    self.createSnapshot = function(serverCriteria, expirationDays) {
        serverCriteria = initCriteria(serverCriteria);

        var result = self.find(serverCriteria)
            .then(extractServerIdFromMetadataList)
            .then(function(serverIds) {
                return serverClient.createSnapshot({serverIds: serverIds, snapshotExpirationDays: expirationDays});
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Create Snapshot").from(result);
    };

    function getSnapshotId(server) {
        var snapshot = server.details ? server.details.snapshots[0] : null;
        if (!snapshot) {
            throw new Error("The server " + server.id + " does not contain any snapshots");
        }

        var snapshotLink = _.findWhere(snapshot.links, {rel: "self"}).href;

        return _.last(snapshotLink.split('/'));
    }

    function setServerIdToJobInfo(server) {
        return function(jobInfo) {
            return _.extend(jobInfo, {server: server.id});
        };
    }

    /**
     * Delete snapshot for servers.
     * @param {ServerCriteria} arguments - criteria that specify set of servers to perform delete snapshot operation on.
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function deleteSnapshot
     */
    self.deleteSnapshot = function() {
        var criteria = initCriteria(arguments);

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.settle(
                    _.map(servers, function(server) {
                        return serverClient.deleteSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Delete Snapshot").fromInspections(result);
    };

    /**
     * Revert servers to snapshot.
     * @param {ServerCriteria} arguments - criteria that specify set of servers to perform revert operation on.
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function revertToSnapshot
     */
    self.revertToSnapshot = function() {
        var criteria = initCriteria(arguments);

        var result = self.find(criteria)
            .then(function(servers) {
                return Promise.settle(
                    _.map(servers, function(server) {
                        return serverClient.revertToSnapshot(server.id, getSnapshotId(server))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Revert to Snapshot").fromInspections(result);
    };

    /**
     * Add public ip to group of servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers
     * @param {PublicIpConfig} publicIpConfig - add public ip config
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function addPublicIp
     */
    self.addPublicIp = function(searchCriteria, publicIpConfig) {
        var result = self
            .find(self._searchCriteriaFrom(searchCriteria))
            .then(function (servers) {
                return Promise.settle(_.map(servers, function(server) {
                    return serverClient
                        .addPublicIp(server.id, new PublicIpConverter().convert(publicIpConfig))
                        .then(setServerIdToJobInfo(server));
                }));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Add Public IP").fromInspections(result);
    };

    function loadPublicIpDetails(server) {
        return Promise.all(
            _.map(fetchPublicIpList(server), function(ip){
                return Promise.props(
                    {
                        address: serverClient.getPublicIp(server.id, ip),
                        publicIp: ip
                    }
                );
            })
        );
    }

    function extendPublicIp(props) {
        return Promise.all(
            _.map(props, function(enhancedIp) {
                return _.extend(enhancedIp.address, {publicIPAddress: enhancedIp.publicIp});
            })
        );
    }

    /**
     * Find all ipAddresses including opened ports and source restrictions for a single server by search criteria.
     * @param {ServerCriteria} arguments - criteria that specify single server
     * @returns {Promise<PublicIpConfig>} promise that resolved by list of PublicIpConfig
     *
     * @memberof Servers
     * @instance
     * @function findPublicIp
     */
    self.findPublicIp = function() {
        var criteria = self._searchCriteriaFrom(arguments);

        return self
            .findSingle(criteria)
            .then(loadPublicIpDetails)
            .then(extendPublicIp);
    };

    /**
     * Remove all public ipAddresses for set of servers by search criteria.
     * @param {ServerCriteria} arguments - criteria that specify a set of servers
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function removeAllPublicIp
     */
    self.removeAllPublicIp = function() {
        var criteria = self._searchCriteriaFrom(arguments);

        var result = self
            .find(criteria)
            .then(function(servers) {
                return Promise.all(
                    _.map(servers, function(server) {
                        return Promise.all(
                            _.map(fetchPublicIpList(server), function(publicIp) {
                                return serverClient
                                    .removePublicIp(server.id, publicIp)
                                    .then(setServerIdToJobInfo(server));
                            })
                        );
                    })
                );

            })
            .then(_.flatten);

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Remove all Public IP").from(result);
    };

    /**
     * Remove public ipAddresses for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify single server
     * @param {String} publicIp - public ip
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function removePublicIp
     */
    self.removePublicIp = function(searchCriteria, publicIp) {
        var result = self
            .findSingle(searchCriteria)
            .then(function(server) {
                return serverClient
                    .removePublicIp(server.id, publicIp)
                    .then(setServerIdToJobInfo(server));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Remove public IP").from(result);
    };

    /**
     * Modify all public ip for set of servers.
     * @param {ServerCriteria} searchCriteria - criteria that specify set of servers
     * @param {PublicIpConfig} publicIpConfig - public ip config
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function modifyAllPublicIp
     */
    self.modifyAllPublicIp = function(searchCriteria, publicIpConfig) {
        var result = self
            .find(self._searchCriteriaFrom(searchCriteria))
            .then(_.partial(doModifyAllPublicIp, publicIpConfig))
            .then(_.flatten);

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Modif all public IP").from(result);
    };

    function doModifyAllPublicIp(publicIpConfig, servers) {
        return Promise.all(
            _.map(servers, function(server) {
                return Promise.all(
                    _.map(fetchPublicIpList(server), function(publicIp) {
                        return serverClient
                            .modifyPublicIp(server.id, publicIp, convertPublicIpConfig(publicIpConfig))
                            .then(setServerIdToJobInfo(server));
                    })
                );
            })
        );
    }

    /**
     * Modify public ipAddresses for a single server by search criteria.
     * @param {ServerCriteria} searchCriteria - criteria that specify single server
     * @param {String} publicIp - public ip
     * @param {PublicIpConfig} publicIpConfig - public ip config
     * @returns {Promise<Reference>} the promise with server references
     *
     * @memberof Servers
     * @instance
     * @function modifyPublicIp
     */
    self.modifyPublicIp = function(searchCriteria, publicIp, publicIpConfig) {
        var result = self
            .findSingle(searchCriteria)
            .then(function(server) {
                return serverClient
                    .modifyPublicIp(server.id, publicIp, convertPublicIpConfig(publicIpConfig))
                    .then(setServerIdToJobInfo(server));
            });

        return new OperationPromise(queueClient, extractServerIdsFromStatus, "Modify public IP").from(result);
    };

    function fetchPublicIpList(server) {
        return _.chain(server.details.ipAddresses)
            .pluck("public")
            .compact()
            .value();
    }

    function convertPublicIpConfig(publicIpConfig) {
        return new PublicIpConverter().convert(publicIpConfig);
    }

    /**
    * Initiate SSH client for a servers.
    * @param {ServerCriteria} arguments - criteria that specify set of servers
    * @returns {SshClient} the queued operation. Returns ssh client
    *
    * @memberof Servers
    * @instance
    * @function execSsh
    */
    self.execSsh = function() {
        var promise = self.find(arguments)
            .then(loadPublicIp)
            .then(loadPublicIpWithSshAndCredentials);

        return new SshClient(promise);
    };

    function loadPublicIp(servers) {
        return Promise.all(_.map(servers, function(server) {
            return Promise.props({
                ipAddress: self.findPublicIp(server),
                server: server
            });
        }));
    }

    function loadPublicIpWithSshAndCredentials(serverData) {
        return Promise.all(_.map(serverData, function(data) {
            return Promise.props({
                ipAddress: getIpAddressPromise(data),
                server: data.server,
                credentials: self.findCredentials(data.server)
            });
        }));
    }

    function getIpAddressPromise(prop) {
        if (findPublicIpWithOpenSshPort(prop.ipAddress)) {
            return findPublicIpWithOpenSshPort(prop.ipAddress);
        }
        return self.addPublicIp(prop.server, {openPorts: [Server.Port.SSH]})
            .then(_.partial(self.findPublicIp, prop.server))
            .then(findPublicIpWithOpenSshPort);
    }

    function findPublicIpWithOpenSshPort(ipAddresses) {
        if (ipAddresses.length === 0) {
            return null;
        }

        return _.chain(ipAddresses)
            .filter(function(address) {
                return _.findWhere(address.ports, {port: Server.Port.SSH});
            })
            .first()
            .value();
    }

    /**
     * Adds the secondary networks for a servers.
     * @param {ServerCriteria} serverSearchCriteria - criteria that specify set of servers
     * @param {NetworkCriteria} networkSearchCriteria - criteria that specify set of networks
     * @returns {Promise<Array<Reference>>} the queued operation. Returns the list of server references
     *
     * @memberof Servers
     * @instance
     * @function addSecondaryNetwork
     */
    self.addSecondaryNetwork = function(serverSearchCriteria, networkSearchCriteria) {

        var result = networkService.find(networkSearchCriteria)
            .then(function(networks) {
                return Promise.props(
                    {
                        configs: _.map(networks, _.partial(composeSecondaryNetworkConfig, networkSearchCriteria)),
                        servers: self.find(serverSearchCriteria)
                    }
                );
            })
            .then(addSecondaryNetworksForServers);

        return new OperationPromise(experimentalQueueClient, extractServerIdsFromStatus, "Add Secondary Network")
            .fromInspections(result);
    };

    function composeSecondaryNetworkConfig(networkSearchCriteria, network) {
        var cfg = {
            networkId: network.id
        };

        if (networkSearchCriteria.ipAddress) {
            cfg.ipAddress = networkSearchCriteria.ipAddress;
        }

        return cfg;
    }

    function addSecondaryNetworksForServers(prop) {
        return Promise.settle(
            _.chain(prop.servers)
            .map(_.partial(addSecondaryNetworks, prop.configs))
            .flatten()
            .value()
        );
    }

    function addSecondaryNetworks(configs, server) {
        return _.map(configs, _.partial(addSecondaryNetwork, server));
    }

    function addSecondaryNetwork(server, config) {
        return serverClient.addSecondaryNetwork(server.id, config)
            .then(setServerIdToJobInfo(server));
    }

    /**
     * Removes the secondary networks for a servers.
     * @param {ServerCriteria} serverSearchCriteria - criteria that specify set of servers
     * @param {NetworkCriteria} networkSearchCriteria - criteria that specify set of networks
     * @returns {Promise<Array<Reference>>} the queued operation. Returns the list of server references
     *
     * @memberof Servers
     * @instance
     * @function removeSecondaryNetwork
     */
    self.removeSecondaryNetwork = function(serverSearchCriteria, networkSearchCriteria) {
        var result = Promise.props(
                {
                    networks: networkService.find(networkSearchCriteria || {}, IpAddressDetails.CLAIMED),
                    servers: self.find(serverSearchCriteria)
                }
            )
            .then(filterSecondaryNetworks)
            .then(function(networks) {
                return Promise.all(
                    _.chain(networks)
                        .map(removeSecondaryNetwork)
                        .flatten()
                        .value()
                );
            });

        return new OperationPromise(experimentalQueueClient, extractServerIdsFromStatus, "Remove secondary network")
            .from(result);
    };

    function filterSecondaryNetworks(props) {
        var serverNames = _.pluck(props.servers, 'name');

        return _.filter(props.networks, function(network) {
            _.each(network.ipAddresses, function(ip) {
                if (!ip.primary && serverNames.indexOf(ip.server) > -1) {
                    if (!network.servers) {
                        network.servers = [];
                    }
                    network.servers.push(_.findWhere(props.servers, {name: ip.server}));
                }
            });

            return !_.isEmpty(network.servers);
        });
    }

    function removeSecondaryNetwork(network) {
        return _.map(network.servers, function(server) {
            return serverClient.removeSecondaryNetwork(server.id, network.id)
                .then(setServerIdToJobInfo(server));
        });
    }

    /**
     * Sets an auto scale policy to a servers
     * @param serverSearchCriteria - criteria that specify set of servers
     * @param policyCriteria - criteria that specify auto scale policy, that will be applied to a server
     * @returns {Promise<Array<Reference>>} the queued operation. Returns the list of server references
     */
    self.setAutoScalePolicy = function(serverSearchCriteria, policyCriteria) {
        return self.find(serverSearchCriteria)
            .then(function(servers) {
                return policyService.autoScale().vertical().findSingle(policyCriteria)
                    .then(function(policy) {
                        return Promise.all(_.map(servers, _.partial(setAutoScalePolicy, _, policy)));
                    })
                    .then(_.partial(Promise.resolve, _.map(servers, metadataToRef)));
        });
    };

    function setAutoScalePolicy(server, policy) {
        return serverClient.setAutoScalePolicy(server.id, policy.id);
    }

    /**
     * Removes an auto scale policy from servers
     * @param serverSearchCriteria - criteria that specify set of servers
     * @returns {Promise<Array<Reference>>} the queued operation. Returns the list of server references
     */
    self.removeAutoScalePolicy = function(serverSearchCriteria) {
        return self.find(serverSearchCriteria)
            .then(removeAutoScalePolicyForServers);
    };

    function removeAutoScalePolicyForServers(servers) {
        return Promise.all(_.map(servers, removeAutoScalePolicy))
            .then(_.partial(Promise.resolve, _.each(servers, metadataToRef)));
    }

    function removeAutoScalePolicy(server) {
        return serverClient.removeAutoScalePolicy(server.id);
    }

    init();
}
},{"./../../base-services/queue/domain/create-server-job.js":11,"./../../base-services/queue/domain/operation-promise.js":13,"./../../core/search/criteria.js":94,"./../../core/search/search-support.js":96,"./../networks/domain/ip-address-details":36,"./domain/public-ip-converter.js":65,"./domain/server-criteria":66,"./domain/server.js":67,"./domain/ssh-client.js":69,"bluebird":"bluebird","underscore":"underscore"}],72:[function(require,module,exports){

module.exports = BillingStatsConverter;

function BillingStatsConverter() {

    var self = this;

    self.convertClientResponse = function(clientBilling) {
        var groupBillingList = [];
        var groups = clientBilling.groups;

        for (var groupId in groups) {
            if (!groups.hasOwnProperty(groupId)) {
                continue;
            }

            var servers = groups[groupId].servers;
            var serverBillingList = [];

            for (var serverId in servers) {
                if (!servers.hasOwnProperty(serverId)) {
                    continue;
                }

                serverBillingList.push(
                    convertServerBilling(serverId, servers[serverId])
                );
            }

            groupBillingList.push(
                convertGroupBilling(groupId, groups[groupId].name, serverBillingList)
            );
        }

        return {
            date: clientBilling.date,
            groups: groupBillingList
        };
    };

    function convertGroupBilling(groupId, groupName, serverBillingList) {
        return {
            groupId: groupId,
            groupName: groupName,
            servers: serverBillingList
        };
    }

    function convertServerBilling(serverId, clientServerBilling) {
        return {
            serverId: serverId,
            templateCost: clientServerBilling.templateCost,
            archiveCost: clientServerBilling.archiveCost,
            monthlyEstimate: clientServerBilling.monthlyEstimate,
            monthToDate: clientServerBilling.monthToDate,
            currentHour: clientServerBilling.currentHour
        };
    }
}
},{}],73:[function(require,module,exports){
var _ = require('./../../../core/underscore.js');
var Promise = require("bluebird");
var Resource = require('./resource.js');

module.exports = BillingStatsEngine;

/**
 * @typedef Statistics
 * @type {object}
 *
 * @property {string} archiveCost - archive cost.
 * @property {string} templateCost - template cost.
 * @property {string} monthlyEstimate - monthly estimate.
 * @property {string} monthToDate - month to date estimate.
 * @property {string} currentHour - current hour cost.
 *
 * @example Statistics
 * {
 *     templateCost: 0,
 *     archiveCost: 0,
 *     monthlyEstimate: 77.76,
 *     monthToDate": 17.93,
 *     currentHour: 0.108
 * }
 */

/**
 * @typedef BillingStatsEntry
 * @type {object}
 *
 * @property {DataCenterMetadata|GroupMetadata|ServerMetadata} entity - entity metadata.
 * @property {Statistics} statistics - aggregated statistics.
 *
 * @example BillingStatsEntry
 * {
 *     entity: {
 *         id: 5757349d19c343a88ce9a473fe2522f4,
  *        name: Default Group,
  *        ...
  *    },
 *     statistics: {
 *         templateCost: 0,
 *         archiveCost: 0,
 *         monthlyEstimate: 77.76,
 *         monthToDate: 17.93,
 *         currentHour: 0.108
 *     }
 * }
 */
function BillingStatsEngine(statsParams, serverService, groupService, dataCenterService) {
    var self = this;

    function init() {
        parseSearchCriteria();
        parseGroupingParam();
        parseSubItemsAggregationAbility();
        parseSummarizeAbility();
    }

    function parseSearchCriteria() {
        if (statsParams.group) {
            self.groupCriteria = statsParams.group;
        } else if (statsParams.dataCenter) {
            self.dataCenterCritiria = statsParams.dataCenter;
        } else if (statsParams.server) {
            self.serverCriteria = statsParams.server;
        } else {
            self.dataCenterCritiria = {};
        }
    }

    function parseGroupingParam() {
        if (statsParams.groupBy !== Resource.SERVER && statsParams.groupBy !== Resource.DATACENTER) {
            self.groupBy = Resource.GROUP;
        } else {
            self.groupBy = statsParams.groupBy;
        }
    }

    function parseSubItemsAggregationAbility() {
        self.aggregateSubItems = statsParams.aggregateSubItems === true;
    }

    function parseSummarizeAbility() {
        self.summarize = statsParams.summarize === true;
    }

    self.execute = function() {
        var statsData = fetchStatsData().then(includeSubItemsIfNecessary);

        if (self.summarize) {
            return statsData.then(summarizeStatistics);
        }

        switch(self.groupBy) {
            case Resource.GROUP:
                return statsData.then(groupByGroup);
            case Resource.DATACENTER:
                return statsData
                    .then(attachDataCenterId)
                    .then(groupByDataCenter)
                    .then(loadDataCenterMetadata);
            case Resource.SERVER:
                return statsData.then(groupByServer);
            default:
                throw new Error("the groupBy property not defined");
        }
    };

    function summarizeStatistics(data) {
        var statistics = createStatisticsObject();

        _.each(data, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                aggregateGroupStats(statistics, groupBilling);
            });
        });

        return statistics;
    }

    function groupByGroup(statsDataList) {
        var result = [];

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                var statistics = createStatisticsObject();
                aggregateGroupStats(statistics, groupBilling);

                result.push(Promise.props({
                    entity: groupService.findSingle({ id: groupBilling.groupId }),
                    statistics: statistics
                }));
            });
        });

        return Promise.all(result);
    }

    function attachDataCenterId(statsDataList) {
        var result = _.map(statsDataList, function(statsData) {
            var groups = _.map(statsData.groups, function(groupBilling) {
                return groupService
                    .findSingle({
                        id: groupBilling.groupId
                    })
                    .then(function(groupMetadata) {
                        return _.extend(groupBilling, {
                            dataCenterId: groupMetadata.locationId.toLowerCase()
                        });
                    });
            });

            return Promise.props({
                date: statsData.date,
                groups: Promise.all(groups)
            });
        });

        return Promise.all(result);
    }

    function loadDataCenterMetadata(dataCenterMap) {
        var result = [];

        for (var dataCenterId in dataCenterMap) {
            if (!dataCenterMap.hasOwnProperty(dataCenterId)) {
                continue;
            }

            result.push(Promise.props({
                entity: dataCenterService.findSingle({ id: dataCenterId }),
                statistics: dataCenterMap[dataCenterId]
            }));
        }

        return Promise.all(result);
    }

    function groupByDataCenter(statsDataList) {
        var dataCenterMap = {};

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                var dataCenterId = groupBilling.dataCenterId;

                if (dataCenterMap.hasOwnProperty(dataCenterId)) {
                    aggregateGroupStats(dataCenterMap[dataCenterId], groupBilling);
                } else {
                    var statistics = createStatisticsObject();
                    aggregateGroupStats(statistics, groupBilling);
                    dataCenterMap[dataCenterId] = statistics;
                }
            });
        });

        return dataCenterMap;
    }

    function groupByServer(statsDataList) {
        var result = [];

        _.each(statsDataList, function(statsData) {
            _.each(statsData.groups, function(groupBilling) {
                _.each(groupBilling.servers, function(serverBilling) {
                    if (checkServerId(serverBilling.serverId)) {
                        var statistics = createStatisticsObject();
                        aggregateServerStats(statistics, serverBilling);

                        result.push(Promise.props({
                            entity: serverService.findSingle({ id: serverBilling.serverId }),
                            statistics: statistics
                        }));
                    }
                });
            });
        });

        return Promise.all(result);
    }

    function createStatisticsObject() {
        return {
            archiveCost: 0,
            templateCost: 0,
            monthlyEstimate: 0,
            monthToDate: 0,
            currentHour: 0
        };
    }

    function aggregateGroupStats(statistics, groupBilling) {
        _.each(groupBilling.servers, function(serverBilling) {
            if (checkServerId(serverBilling.serverId)) {
                aggregateServerStats(statistics, serverBilling);
            }
        });
    }

    function aggregateServerStats(statistics, serverBilling) {
        statistics.archiveCost = statistics.archiveCost + serverBilling.archiveCost;
        statistics.templateCost = statistics.templateCost + serverBilling.templateCost;
        statistics.monthlyEstimate = statistics.monthlyEstimate + serverBilling.monthlyEstimate;
        statistics.monthToDate = statistics.monthToDate + serverBilling.monthToDate;
        statistics.currentHour = statistics.currentHour + serverBilling.currentHour;
    }

    function checkServerId(serverId) {
        return self.serverIdList === undefined ||
            _.contains(self.serverIdList, serverId);
    }

    function fetchStatsData() {
        if (self.groupCriteria !== undefined) {
            return groupService.getBillingStats(self.groupCriteria);
        }

        if (self.dataCenterCritiria !== undefined) {
            return groupService.getBillingStats({
                dataCenter: self.dataCenterCritiria
            });
        }

        return serverService
            .find(self.serverCriteria)
            .then(collectServerIdList)
            .then(fetchGroupIdList)
            .then(function(groupIdList) {
                return groupService.getBillingStats({
                    id: groupIdList
                });
            });
    }

    function includeSubItemsIfNecessary(statsDataList) {
        if (!self.aggregateSubItems) {
            _.each(statsDataList, function(statsData) {
                statsData.groups = [_.first(statsData.groups)];
            });
        }

        return statsDataList;
    }

    function collectServerIdList(servers) {
        self.serverIdList = _.chain(servers)
            .pluck('id')
            .unique()
            .value();

        return servers;
    }

    function fetchGroupIdList(servers) {
        return _.chain(servers)
            .pluck('groupId')
            .unique()
            .value();
    }

    init();
}
},{"./../../../core/underscore.js":97,"./resource.js":77,"bluebird":"bluebird"}],74:[function(require,module,exports){

var moment = require('moment');
var util = require('util');
var _ = require('./../../../core/underscore.js');
var Type = require('./monitoring-stats-type.js');

module.exports = MonitoringStatsConverter;

MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS = 14;
MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS = 1;
MonitoringStatsConverter.DEFAULT_HOURLY_INTERVAL = '00:01:00:00';

MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS = 4;
MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES = 5;
MonitoringStatsConverter.DEFAULT_REALTIME_INTERVAL = '00:00:05:00';

function MonitoringStatsConverter() {

    var self = this;

    self.TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

    self.validateAndConvert = function(filter) {
        var type = getType(filter);

        if (type === Type.LATEST) {
            return { type: type };
        }

        return type === Type.REALTIME ?
            convertWithinRealTimeType(filter) :
            convertWithinHourlyType(filter);
    };

    function getType(filter) {
        if (filter.type !==  Type.LATEST && filter.type !== Type.REALTIME) {
            return Type.HOURLY;
        }

        return filter.type;
    }

    function convertWithinHourlyType(filter) {
        var start = getStartMoment(filter);
        var interval = getIntervalDuration(filter, MonitoringStatsConverter.DEFAULT_HOURLY_INTERVAL);

        var permittedStart = moment().subtract(MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS, 'days');

        if (start.isBefore(permittedStart)) {
            throw util.format(
                '"start" should be within the past %s day(s)',
                MonitoringStatsConverter.MAX_HOURLY_PERIOD_DAYS
            );
        }



        if (interval < moment.duration({hours: MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS})) {
            throw util.format(
                '"sampleInterval" should be not less than %s hour(s)',
                MonitoringStatsConverter.MIN_HOURLY_INTERVAL_HOURS
            );
        }

        return composeConvertedResult(start, getEndMoment(filter), interval, Type.HOURLY);
    }

    function convertWithinRealTimeType(filter) {
        var start = getStartMoment(filter);
        var interval = getIntervalDuration(filter, MonitoringStatsConverter.DEFAULT_REALTIME_INTERVAL);

        var permittedStart = moment().subtract(MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS, 'hours');

        if (start.isBefore(permittedStart)) {
            throw util.format(
                '"start" should be within the past %s hour(s)',
                MonitoringStatsConverter.MAX_REALTIME_PERIOD_HOURS
            );
        }

        if (interval < moment.duration({minutes: MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES})) {
            throw util.format(
                '"sampleInterval" should be not less than %s minute(s)',
                MonitoringStatsConverter.MIN_REALTIME_INTERVAL_MINUTES
            );
        }

        return composeConvertedResult(start, getEndMoment(filter), interval, Type.REALTIME);
    }

    function composeConvertedResult(start, end, interval, type) {
        checkStatsPeriod(start, end, interval);

        var result = {
            start: start.format(self.TIME_FORMAT),
            sampleInterval: util.format(
                '%s:%s:%s:%s',
                prepareTime(interval.days()),
                prepareTime(interval.hours()),
                prepareTime(interval.minutes()),
                prepareTime(interval.seconds())
            ),
            type: type
        };

        if (end !== undefined) {
            result.end = composeTimeString(end);
        }

        return result;
    }

    function prepareTime(time) {
        return (time < 10 ? '0' : '') + time;
    }

    function getIntervalDuration(filter, defaultInterval) {
        if (filter.sampleInterval === undefined) {
            filter.sampleInterval = defaultInterval;
        }

        var interval = filter.sampleInterval;
        var sampleIntervalError = 'Incorrect "sampleInterval" format';

        /* check if simpleInterval instanceof Moment.Duration */
        if (interval.constructor && interval.constructor.name === "Duration") {
            return interval;
        }

        /* array [days, hours, minutes, seconds] */
       interval = interval.split(':').map(Number);

        _.each(interval, function(number) {
            if (isNaN(number)) {
                throw sampleIntervalError;
            }
        });

        if (interval.length > 4) {
            throw sampleIntervalError;
        } else if (interval.length < 4) {
            while (interval.length < 4) {
                interval.unshift(0);
            }
        }

        return moment.duration({
            seconds: interval[3],
            minutes: interval[2],
            hours: interval[1],
            days: interval[0]
        });
    }

    function getStartMoment(filter) {
        if (filter.start === undefined) {
            throw '"start" should be specified';
        }

        var start = moment(convertDateToString(filter.start));

        if (start.isAfter(moment())) {
            throw '"start" can not be in future';
        }

        return start;
    }

    function getEndMoment(filter) {
        if (filter.end === undefined) {
            return undefined;
        }

        var end = moment(convertDateToString(filter.end));

        if (end.isAfter(moment())) {
            throw '"end" can not be in future';
        }

        return end;
    }

    function convertDateToString(date) {
        return date instanceof Object ?
            moment(date).format(self.TIME_FORMAT) :
            date;
    }

    function composeTimeString(date) {
        return date.format(self.TIME_FORMAT);
    }

    function checkStatsPeriod(start, end, interval) {
        if (end !== undefined && start.isAfter(end)) {
            throw '"start" cannot be later than "end"';
        }

        if (end === undefined) {
            end = moment();
        }

        if (start.isAfter(moment(end).subtract(interval))) {
            throw 'Interval should fit within start/end date';
        }
    }
}
},{"./../../../core/underscore.js":97,"./monitoring-stats-type.js":76,"moment":"moment","util":"util"}],75:[function(require,module,exports){
var _ = require('./../../../core/underscore.js');
var Promise = require("bluebird");
var Resource = require('./resource.js');

module.exports = MonitoringStatsEngine;

/**
 * @typedef Statistics
 * @type {object}
 *
 * @property {string} timestamp - timestamp.
 * @property {string} cpu - cpu count.
 * @property {string} cpuPercent - cpu percent.
 * @property {string} memoryMB - memory.
 * @property {string} memoryPercent - memory percent.
 * @property {string} networkReceivedKBps - network received.
 * @property {string} networkTransmittedKBps - network transmitted.
 * @property {string} diskUsageTotalCapacityMB - disk usage total capacity.
 * @property {Object} diskUsage - disk usage.
 * @property {Object} guestDiskUsage - guest disk usage.
 *
 * @example diskUsage
 * [
 *     {
 *         "id": "0:0",
 *         "capacityMB": 40960
 *     }
 * ],
 *
 * @example guestDiskUsage
 * [
 *     {
 *         "path": "C:\\",
 *         "capacityMB": 40607,
 *         "consumedMB": 16619
 *     }
 * ],
 *
 * @example Statistics
 * {
 *    {
 *        "timestamp": "2014-04-09T20:00:00Z",
 *        "cpu": 1.0,
 *        "cpuPercent": 1.14,
 *        "memoryMB": 2048.0,
 *        "memoryPercent": 9.24,
 *        "networkReceivedKBps": 0.0,
 *        "networkTransmittedKBps": 0.0,
 *        "diskUsageTotalCapacityMB": 40960.0,
 *        "diskUsage": [
 *            {
 *              "id": "0:0",
 *              "capacityMB": 40960
 *            }
 *        ],
 *       "guestDiskUsage": [
 *           {
 *               "path": "C:\\",
 *               "capacityMB": 40607,
 *               "consumedMB": 16619
 *           }
 *       ]
 *     }
 * }
 */

/**
 * @typedef MonitoringStatsEntry
 * @type {object}
 *
 * @property {DataCenterMetadata|GroupMetadata|ServerMetadata} entity - entity metadata.
 * @property {Statistics} statistics - aggregated statistics.
 *
 * @example MonitoringStatsEngine
 * {
 *     entity: {
 *         id: 5757349d19c343a88ce9a473fe2522f4,
  *        name: Default Group,
  *        ...
  *    },
 *     statistics: {Statistics}
 * }
 */
function MonitoringStatsEngine(statsParams, serverService, groupService, dataCenterService) {
    var self = this;

    function init() {
        parseSearchCriteria();
        parseTimeFilter();
        parseGroupingParam();
        parseSubItemsAggregationAbility();
        parseSummarizeAbility();
    }

    function parseSearchCriteria() {
        if (statsParams.group) {
            self.groupCriteria = statsParams.group;
        } else if (statsParams.dataCenter) {
            self.dataCenterCriteria = statsParams.dataCenter;
        } else if (statsParams.server) {
            self.serverCriteria = statsParams.server;
        } else {
            self.dataCenterCriteria = {};
        }
    }

    function parseTimeFilter() {
        self.timeFilter = statsParams.timeFilter;
    }

    function parseGroupingParam() {
        if (statsParams.groupBy !== Resource.SERVER && statsParams.groupBy !== Resource.DATACENTER) {
            self.groupBy = Resource.GROUP;
        } else {
            self.groupBy = statsParams.groupBy;
        }
    }

    function parseSubItemsAggregationAbility() {
        self.aggregateSubItems = statsParams.aggregateSubItems === true;
    }

    function parseSummarizeAbility() {
        self.summarize = statsParams.summarize === true;
    }

    self.execute = function() {
        var statsData = fetchStatsData()
            .then(collectAllTimeIntervals);

        if (self.summarize) {
            return statsData.then(summarizeStatistics);
        }

        switch(self.groupBy) {
            case Resource.GROUP:
                return statsData.then(groupByGroup);
            case Resource.DATACENTER:
                return statsData.then(groupByDataCenter);
            case Resource.SERVER:
                return statsData.then(groupByServer);
            default:
                throw new Error("the groupBy property not defined");
        }
    };

    function summarizeStatistics(statsDataList) {
        var result = [];
        var serverStatsDataList = getServerStatsDataList(statsDataList);

        _.each(self.timeIntervals, function(interval) {
            var statistics = createStatisticsObject();

            _.each(serverStatsDataList, function(serverStatsData) {
                if (serverStatsData.timestamp === interval) {
                    aggregateStatistics(statistics, serverStatsData);
                }
            });

            result.push(collectStats(statistics));
        });

        return result;
    }

    function groupByGroup(statsDataList) {
        return Promise.all(
            _.map(statsDataList, function(groupStatsData) {
                var groupStatsByIntervals = summarizeStatistics(groupStatsData);

                return Promise.props({
                    entity: groupStatsData.group,
                    statistics: groupStatsByIntervals
                });
            })
        );
    }

    function groupByServer(statsDataList) {
        return Promise.all(
            _.map(getServerDataList(statsDataList), function(serverData) {
                return Promise.props({
                    entity: serverService.findSingle({
                        id: serverData.name.toLowerCase()
                    }),
                    statistics: serverData.stats
                });
            })
        );
    }

    function groupByDataCenter(statsDataList) {
        var dataCenterMap = {};

        _.each(statsDataList, function(groupStatsData) {
            var dataCenterId = groupStatsData.group.locationId.toLowerCase();
            var serverStatsDataList = getServerStatsDataList(groupStatsData);

            dataCenterMap[dataCenterId] = dataCenterMap.hasOwnProperty(dataCenterId) ?
                dataCenterMap[dataCenterId].concat(serverStatsDataList) :
                serverStatsDataList;
        });

        var result = [];

        _.each(dataCenterMap, function(dataCenterStats, dataCenterId) {
            var aggregatedStatsByIntervals = [];

            _.each(self.timeIntervals, function(interval) {
                var statistics = createStatisticsObject();

                _.each(dataCenterStats, function(stats) {
                    if (stats.timestamp === interval) {
                        aggregateStatistics(statistics, stats);
                    }
                });

                aggregatedStatsByIntervals.push(collectStats(statistics));
            });

            result.push(Promise.props({
                entity: dataCenterService.findSingle({id: dataCenterId}),
                statistics: aggregatedStatsByIntervals
            }));
        });

        return Promise.all(result);
    }

    function collectAllTimeIntervals(statsData) {
        self.timeIntervals = fetchServersStream(statsData)
            .pluck('stats').flatten()
            .pluck('timestamp')
            .unique()
            .value();

        return statsData;
    }

    function getServerStatsDataList(statsData) {
        return fetchServersStream(statsData)
            .pluck('stats').flatten()
            .value();
    }

    function getServerDataList(statsData) {
        return fetchServersStream(statsData).value();
    }

    function fetchServersStream(statsData) {
        var allServers = statsData instanceof Array ?
            _.chain(statsData).pluck('servers').flatten() :
            _.chain(statsData.servers);

        return allServers.filter(checkServer);
    }

    function createStatisticsObject() {
        return {
            "timestamp": null,
            "cpu": 0,
            "cpuPercent": 0,
            "memoryMB": 0,
            "memoryPercent": 0,
            "networkReceivedKBps": 0,
            "networkTransmittedKBps": 0,
            "diskUsageTotalCapacityMB": 0,
            "diskUsage": [],
            "guestDiskUsage": []
        };
    }

    function aggregateStatistics(statistics, statsToBeAdded) {
        statistics.counter = statistics.counter !== undefined ? ++statistics.counter : 1;

        if (statistics.timestamp === null) {
            statistics.timestamp = statsToBeAdded.timestamp;
        }

        statistics.cpu += statsToBeAdded.cpu;
        statistics.memoryMB += statsToBeAdded.memoryMB;
        statistics.cpuPercent += statsToBeAdded.cpuPercent;
        statistics.memoryPercent += statsToBeAdded.memoryPercent;

        statistics.networkReceivedKBps += statsToBeAdded.networkReceivedKBps;
        statistics.networkTransmittedKBps += statsToBeAdded.networkTransmittedKBps;
        statistics.diskUsageTotalCapacityMB += statsToBeAdded.diskUsageTotalCapacityMB;

        statistics.diskUsage = statistics.diskUsage.concat(statsToBeAdded.diskUsage);
        statistics.guestDiskUsage = statistics.guestDiskUsage.concat(statsToBeAdded.guestDiskUsage);
    }

    function collectStats(statistics) {
        if (statistics.counter !== undefined) {
            statistics.cpuPercent /= statistics.counter;
            statistics.memoryPercent /= statistics.counter;

            statistics.diskUsage = collectDiskUsageStats(statistics.diskUsage);
            statistics.guestDiskUsage = collectGuestDiskUsageStats(statistics.guestDiskUsage);

            delete statistics.counter;
        }

        return statistics;
    }

    function collectDiskUsageStats(diskUsageStats) {
        var diskUsageMap = {};

        _.each(diskUsageStats, function(disk) {
            if (diskUsageMap[disk.id] === undefined) {
                diskUsageMap[disk.id] = disk;
            } else {
                diskUsageMap[disk.id]['capacityMB'] += disk.capacityMB;
            }
        });

        return _.values(diskUsageMap);
    }

    function collectGuestDiskUsageStats(guestDiskUsageStats) {
        var diskUsageMap = {};

        _.each(guestDiskUsageStats, function(disk) {
            if (diskUsageMap[disk.path] === undefined) {
                diskUsageMap[disk.path] = disk;
            } else {
                diskUsageMap[disk.path]['capacityMB'] += disk.capacityMB;
                diskUsageMap[disk.path]['consumedMB'] += disk.consumedMB;
            }
        });

        return _.values(diskUsageMap);
    }

    function checkServer(server) {
        return self.serverIdList === undefined ||
            _.contains(self.serverIdList, server.name.toLowerCase());
    }

    function fetchStatsData() {
        if (self.groupCriteria !== undefined) {
            return self.aggregateSubItems ?
                fetchGroupStatsDataWithSubItems() :
                groupService.getMonitoringStats(self.groupCriteria, self.timeFilter);
        }

        if (self.dataCenterCriteria !== undefined) {
            return groupService.getMonitoringStats(
                { dataCenter: self.dataCenterCriteria },
                self.timeFilter
            );
        }

        return serverService
            .find(self.serverCriteria)
            .then(collectServerIdList)
            .then(fetchGroupIdList)
            .then(function(groupIdList) {
                return groupService.getMonitoringStats(
                    { id: groupIdList },
                    self.timeFilter
                );
            });
    }

    function fetchGroupStatsDataWithSubItems() {
        return groupService
            .find(self.groupCriteria)
            .then(function(groupMetadataList) {
                return Promise.all(
                    _.map(groupMetadataList, function(groupMetadata) {
                        return groupMetadata.getAllGroups();
                    })
                );
            })
            .then(_.flatten)
            .then(function(groupMetadataList) {
                return _.pluck(groupMetadataList, 'id');
            })
            .then(function (groupIdList) {
                return groupService.getMonitoringStats(
                    {id: groupIdList},
                    self.timeFilter
                );
            });
    }

    function collectServerIdList(servers) {
        self.serverIdList = pluckPropertiesFromList('id', servers);

        return servers;
    }

    function fetchGroupIdList(servers) {
        return pluckPropertiesFromList('groupId', servers);
    }

    function pluckPropertiesFromList(property, list) {
        return _.chain(list)
            .pluck(property)
            .unique()
            .value();
    }

    init();
}
},{"./../../../core/underscore.js":97,"./resource.js":77,"bluebird":"bluebird"}],76:[function(require,module,exports){

var MonitoringStatsType = {
    HOURLY: 'hourly',
    REALTIME: 'realtime',
    LATEST: 'latest'

};

module.exports = MonitoringStatsType;
},{}],77:[function(require,module,exports){

var Resource = {
    DATACENTER: 'dataCenter',
    GROUP: 'group',
    SERVER: 'server'

};

module.exports = Resource;
},{}],78:[function(require,module,exports){

var Promise = require('bluebird');
var _ = require('./../../core/underscore.js');
var SearchSupport = require('./../../core/search/search-support.js');
var ServerCriteria = require('../servers/domain/server-criteria.js');
var BillingStatsEngine = require('./domain/billing-stats-engine.js');
var MonitoringStatsEngine = require('./domain/monitoring-stats-engine.js');

var Criteria = require('./../../core/search/criteria.js');

module.exports = Statistics;

/**
 * The service that works with statistics
 *
 * @constructor
 */
function Statistics (serverService, groupService, dataCenterService) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Get aggregated billing stats.
     * @param {Object} statsParams - filter and grouping params
     * filter by all dataCenters and grouping by group by default
     * @example
     * {
     *     group: {
     *         dataCenter: DataCenter.US_EAST_STERLING,
     *         name: Group.DEFAULT
     *     },
     *     groupBy: Resource.DATACENTER
     * }
     *
     * @returns {Promise<BillingStatsEntry[]>} - promise that resolved by list of BillingStatsEntry.
     *
     * @instance
     * @function billingStats
     * @memberof Statistics
     */
    self.billingStats = function (statsParams) {
        var statsEngine = new BillingStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    /**
     * Get aggregated monitoring stats.
     * @param {Object} statsParams - filter and grouping params
     * filter by all dataCenters and grouping by group by default
     * @example
     * {
     *     group: {
     *         dataCenter: DataCenter.US_EAST_STERLING,
     *         name: Group.DEFAULT
     *     },
     *     timeFilter: {
     *           start: '2015-04-05T16:00:00',
     *           end: '2015-04-05T22:00:00',
     *           sampleInterval: '02:00:00',
     *           type: MonitoringStatsType.HOURLY
     *     },
     *     groupBy: Resource.SERVER
     * }
     *
     * @returns {Promise<MonitoringStatsEntry[]>} - promise that resolved by list of MonitoringStatsEntry.
     *
     * @instance
     * @function monitoringStats
     * @memberof Statistics
     */
    self.monitoringStats = function (statsParams) {
        var statsEngine = new MonitoringStatsEngine(statsParams, serverService, groupService, dataCenterService);

        return statsEngine.execute();
    };

    init();
}

},{"../servers/domain/server-criteria.js":66,"./../../core/search/criteria.js":94,"./../../core/search/search-support.js":96,"./../../core/underscore.js":97,"./domain/billing-stats-engine.js":73,"./domain/monitoring-stats-engine.js":75,"bluebird":"bluebird"}],79:[function(require,module,exports){

var Os = {
    CENTOS: "centOS",
    RHEL: "redHat",
    DEBIAN: "debian",
    WINDOWS: "windows",
    UBUNTU: "ubuntu"
};

module.exports = Os;
},{}],80:[function(require,module,exports){

var Predicate = require('./../../../core/predicates/predicates.js');
var _ = require('underscore');
var DataCenterCriteria = require('./../../../base-services/datacenters/domain/datacenter-criteria.js');
var Criteria = require('./../../../core/search/criteria.js');

module.exports = SingleTemplateCriteria;

/**
 * @typedef SingleTemplateCriteria
 * @type {object}
 *
 * @property {String | Array<String>} name - a template name restriction.
 * @property {String | Array<String>} nameContains - restriction that pass only template
 * which name contains specified keyword.
 * @property {String | Array<String>} descriptionContains - restriction that pass only template
 * which description contains specified keyword.
 * @property {object} operatingSystem
 * @property {string} operatingSystem.family - search templates with operation system of specified os family.
 * @property {string} operatingSystem.version - search templates of specified os version.
 * @property {string} operatingSystem.edition - search templates of specified os edition.
 * @property {Architecture} operatingSystem.architecture - search templates of specified architecture.
 * @property {DataCenterCriteria} dataCenter - restrict datacenters in which need to execute search.
 * @property {String | Array<String>} dataCenterId - restrict templates by DataCenter ID.
 * @property {String | Array<String>} dataCenterName - restrict templates by DataCenter Name.
 * @property {String | Array<String>} dataCenterNameContains - search templates with name
 * that contains specified keyword.
 */
function SingleTemplateCriteria (criteria) {
    var self = this;
    var criteriaHelper, filters;

    function init() {
        criteriaHelper = new Criteria(criteria);
        filters = criteriaHelper.getFilters();

        self.criteriaRootProperty = 'dataCenter';

        self.criteriaPropertiesMap = {
            id: 'dataCenterId',
            name: 'dataCenterName',
            nameContains: 'dataCenterNameContains',
            where: 'dataCenterWhere'
        };
    }

    function filterByOs() {
        if (!criteria.operatingSystem) {
            return Predicate.alwaysTrue();
        }

        var osCriteria = criteria.operatingSystem;

        return new Predicate(function(data) {
            var osType = data.osType.toUpperCase();

            if (!osCriteria) {
                return true;
            }

            if (osCriteria.family) {
                if (osType.indexOf(osCriteria.family.toUpperCase()) === 0) {
                    osType = osType.replace(osCriteria.family.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.architecture) {
                if (osType.indexOf(osCriteria.architecture.toUpperCase()) > -1) {
                    osType = osType.replace(osCriteria.architecture.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.version) {
                if (osType.indexOf(osCriteria.version.toUpperCase()) === 0) {
                    osType = osType.replace(osCriteria.version.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            if (osCriteria.edition) {
                if (osType.indexOf(osCriteria.edition.toUpperCase()) > -1) {
                    osType = osType.replace(osCriteria.edition.toUpperCase(), "");
                } else {
                    return false;
                }
            }

            return true;
        });
    }

    self.predicate = function (path) {
        return Predicate.extract(
            filters.byRootParam(DataCenterCriteria, 'dataCenter')
                .and(filters.byParamAnyOf('name'))
                .and(filters.byCustomPredicate())
                .and(filters.byParamMatch('nameContains', 'name'))
                .and(filters.byParamMatch('descriptionContains', 'description'))
                .and(filterByOs()),
            path
        );
    };

    self.parseCriteria = function () {
        var parsedCriteria = criteriaHelper.parseSingleCriteria(self);

        if (_.isEmpty(parsedCriteria.dataCenter)) {
            delete parsedCriteria.dataCenter;
        }

        return parsedCriteria;
    };

    init();
}
},{"./../../../base-services/datacenters/domain/datacenter-criteria.js":5,"./../../../core/predicates/predicates.js":91,"./../../../core/search/criteria.js":94,"underscore":"underscore"}],81:[function(require,module,exports){

var SingleCriteria = require('./single-template-criteria.js');
var SearchCriteria = require('./../../../core/search/common-criteria.js');

module.exports = TemplateCriteria;

/**
 * Class that used to filter templates
 * @typedef TemplateCriteria
 * @type {(SingleTemplateCriteria|CompositeCriteria)}
 *
 */
function TemplateCriteria (criteria) {
    return new SearchCriteria(criteria, SingleCriteria);
}
},{"./../../../core/search/common-criteria.js":92,"./single-template-criteria.js":80}],82:[function(require,module,exports){

var Promise = require('bluebird');
var _ = require('underscore');
var SearchSupport = require('./../../core/search/search-support.js');
var TemplateCriteria = require('./domain/template-criteria.js');

var Criteria = require('./../../core/search/criteria.js');

module.exports = Templates;

/**
 * @typedef TemplateMetadata
 * @type {object}
 * @property {string} name - Underlying unique name for the template.
 * @property {string} description - Description of the template.
 * @property {int} storageSizeGB - The amount of storage allocated for the primary OS root drive.
 * @property {Array<string>} capabilities - List of capabilities supported by this specific OS template
 * (example: whether adding CPU or memory requires a reboot or not).
 * @property {Array<string>} reservedDrivePaths - List of drive path names reserved by the OS
 * that can't be used to name user-defined drives.
 * @property {int} drivePathLength - Length of the string for naming a drive path, if applicable.
 */

/**
 * @typedef ServerImportMetadata
 * @type {object}
 * @property {string} id - ID of the OVF.
 * @property {string} name - Name of the OVF.
 * @property {int} storageSizeGB - Number of GB of storage the server is configured with.
 * @property {int} cpuCount - Number of processors the server is configured with.
 * @property {int} memorySizeMB - Number of MB of memory the server is configured with.
 */

/**
 * The service that works with template
 *
 * @constructor
 */
function Templates (dataCenterService, serverClient) {
    var self = this;

    function init () {
        SearchSupport.call(self);
    }

    /**
     * Search template
     * @param {...TemplateCriteria}
     * @returns {Promise<Array<TemplateMetadata>>} That
     *
     * @memberof Templates
     * @instance
     * @function find
     */
    self.find = function () {
        var criteria = new TemplateCriteria(self._searchCriteriaFrom(arguments)).parseCriteria();

        var dataCenterCriteria = new Criteria(criteria).extractSubCriteria(function (criteria) {
            return criteria.dataCenter;
        });

        return dataCenterService.find(dataCenterCriteria)
            //filter by data center
            .then(function(dataCenters) {
                return findByDataCenterIds({
                    dataCenters: _.asArray(dataCenters)
                });
            })
            .then(function(templates) {
                if (!templates || templates.length === 0) {
                    return [];
                }
                return _.filter(templates, new TemplateCriteria(criteria).predicate().fn);
            });
    };

    function findByDataCenterIds(criteria) {
        var dataCenters = criteria.dataCenters || [];
        return _.chain([dataCenters])
            .flatten()
            .map(function (dataCenter) {
                return Promise.props({
                    dataCenter: dataCenter,
                    capabilities: dataCenterService.getDeploymentCapabilities(dataCenter.id)
                });
            })
            .arrayPromise()
            .then(function (list) {
                _.each(list, function(res) {
                    _.each(res.capabilities.templates, function(t) {
                        t.dataCenter = res.dataCenter;
                    });
                });
                return _.pluck(_.pluck(list, 'capabilities'), 'templates');
            })
            .then(_.flatten)
            .value();
    }

    /**
     * Method returns list of available server imports for specified datacenter
     *
     * @param {DataCenterCriteria} args - Search criteria that specify single target datacenter
     * @returns {Promise<Array<ServerImportMetadata>>} Promise of available server imports list
     *
     * @memberof Templates
     * @instance
     * @function findAvailableServerImports
     */
    self.findAvailableServerImports = function () {
        return dataCenterService
            .findSingle(self._searchCriteriaFrom(arguments))
            .then(_.property('id'))
            .then(serverClient.findAvailableServerImports);
    };

    init();
}

},{"./../../core/search/criteria.js":94,"./../../core/search/search-support.js":96,"./domain/template-criteria.js":81,"bluebird":"bluebird","underscore":"underscore"}],83:[function(require,module,exports){
var properties = require('../package.json');

module.exports = Config;

function Config() {
    var self = this;

    self.fetchUserAgent = function() {
        var properties = getProperties();
        return properties.name + "-v" + properties.version;
    };

    function getProperties() {
        return properties;
    }
}
},{"../package.json":99}],84:[function(require,module,exports){
(function (process){

module.exports = {
    StaticCredentialsProvider: StaticCredentialsProvider,
    CommandLineCredentialsProvider: CommandLineCredentialsProvider,
    EnvironmentCredentialsProvider: EnvironmentCredentialsProvider
};

function StaticCredentialsProvider (username, password) {
    var self = this;

    self.getUsername = function () {
        return username;
    };

    self.getPassword = function () {
        return password;
    };
}

function CommandLineCredentialsProvider (usernameKey, passwordKey) {
    var self = this;
    var username;
    var password;

    function init () {
        var args = {};

        process.argv.forEach(function (item) {
            args[item.split('=')[0]] = item.split('=')[1];
        });

        username = args[usernameKey || '--clc.username'];
        password = args[passwordKey || '--clc.password'];
    }

    self.getUsername = function () {
        return username;
    };

    self.getPassword = function () {
        return password;
    };

    init();
}

function EnvironmentCredentialsProvider (usernameKey, passwordKey) {
    var self = this;
    var username;
    var password;

    function init () {
        username = process.env[usernameKey] || process.env.CLC_USERNAME;
        password = process.env[passwordKey] || process.env.CLC_PASSWORD;
    }

    self.getUsername = function () {
        return username;
    };

    self.getPassword = function () {
        return password;
    };

    init();
}
}).call(this,require('_process'))
},{"_process":98}],85:[function(require,module,exports){

var rest = require('restling');
var Config = require('./../../config.js');

function LoginClient () {
    var self = this;
    var userAgent = new Config().fetchUserAgent();

    self.login = function (username, password) {
        return rest
            .postJson(
                'https://api.ctl.io/v2/authentication/login',
                { username: username, password: password },
                {headers: {'User-Agent': userAgent}}
            )
            .then(function (result) {
                return result.data;
            }, function (e) {
                console.log(e);
            });
    };
}

module.exports = new LoginClient();
},{"./../../config.js":83,"restling":"restling"}],86:[function(require,module,exports){
(function (process){

var rest = require('restling');
var _ = require('underscore');
var SdkClient = require('./sdk-client.js');
var loginClient = require('./../auth/login-client.js');
var Config = require('./../../config.js');

module.exports = AuthenticatedClient;

function AuthenticatedClient (username, password, options) {
    var self = this;
    var sdkClient = new SdkClient(options);
    var accountPromise;
    var userAgent = new Config().fetchUserAgent();

    function authHeader (account) {
        return { accessToken: account.bearerToken };
    }

    function resolveAliasTemplate(url, account) {
        return url.replace('{ACCOUNT}', account.accountAlias);
    }

    function makeOptions(options, account) {
        return _.extend({headers: {'User-Agent': userAgent}}, authHeader(account), options);
    }

    function whenAccountResolved(callback) {
        var promise = accountPromise || (accountPromise = login(username, password));
        return promise.then(callback);
    }

    function login(username, password) {
        var args = {};

        process.argv.forEach(function (item) {
            args[item.split('=')[0]] = item.split('=')[1];
        });

        return loginClient
            .login(
                username || args['--clc.username'] || process.env.CLC_USERNAME,
                password || args['--clc.password'] || process.env.CLC_PASSWORD
            );
    }

    self.get = function (url, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.get(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.postJson = function (url, requestData, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.postJson(
                resolveAliasTemplate(url, account),
                requestData,
                makeOptions(options, account)
            );
        });
    };

    self.delete = function (url, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.delete(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.patch = function (url, options) {
        return whenAccountResolved(function (account) {

            return sdkClient.patch(
                resolveAliasTemplate(url, account),
                makeOptions(options, account)
            );
        });
    };

    self.patchJson = function (url, data, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.patchJson(
                resolveAliasTemplate(url, account),
                data,
                makeOptions(options, account)
            );
        });
    };

    self.putJson = function (url, data, options) {
        return whenAccountResolved(function (account) {
            return sdkClient.putJson(
                resolveAliasTemplate(url, account),
                data,
                makeOptions(options, account)
            );
        });
    };

    self.mixinStatusSupport = sdkClient.mixinStatusSupport;

}
}).call(this,require('_process'))
},{"./../../config.js":83,"./../auth/login-client.js":85,"./sdk-client.js":88,"_process":98,"restling":"restling","underscore":"underscore"}],87:[function(require,module,exports){
var Promise = require('bluebird');

module.exports = PromiseRetry;

function PromiseRetry(fn, args, opts) {
    opts = opts || {};
    opts.max = opts.max || 5;
    opts.retryInterval = opts.retryInterval || 1000;

    function ServerError(e) {
        return [200, 201, 204, 404].indexOf(e.statusCode) === -1;
    }

    return new Promise(function (resolve, reject) {
        var attempt = function (i) {
            fn.apply(this, args).then(resolve).catch(ServerError, function (err) {
                if (i >= opts.max) {
                    return reject(err);
                }

                setTimeout(function () {
                    attempt(i + 1);
                }, opts.retryInterval);
            });
        };

        attempt(1);
    });
}
},{"bluebird":"bluebird"}],88:[function(require,module,exports){

var rest = require('restling');
var _ = require('underscore');
var PromiseRetry = require('./promise-retry.js');
var Config = require('./../../config.js');

module.exports = SdkClient;


function SdkClient (options) {
    var CLC_ENDPOINT_URL = 'https://api.ctl.io';
    var self = this;

    var userAgent = new Config().fetchUserAgent();

    var retryOpts = options ?
        {max: options.maxRetries, retryInterval: options.retryInterval} : null;

    function makeOptions(otherOptions) {
        return _.extend({headers: {'User-Agent': userAgent}}, options, otherOptions);
    }

    function extractData (response) {
        return response.data;
    }

    function logError(e) {
        console.error(e.data || "");
        throw e;
    }

    function makeUrl (url) {
        return CLC_ENDPOINT_URL + url;
    }

    self.mixinStatusSupport = function (data) {
        return _.extend(Object.create(new StatusResult()), data);
    };

    self.get = function (url, options) {
        return new PromiseRetry(rest.get, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.postJson = function (url, data, options) {
        return new PromiseRetry(rest.postJson, [makeUrl(url), data, makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.delete = function (url, options) {
        return new PromiseRetry(rest.del, [makeUrl(url), makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    self.patch = function (url, options) {
        return new PromiseRetry(rest.patch, [makeUrl(url), makeOptions(options)], retryOpts);
    };

    function patchJson(url, data, options) {
        return rest.json(url, data, options, 'patch');
    }

    self.patchJson = function (url, data, options) {
        return new PromiseRetry(patchJson, [makeUrl(url), data, makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };

    function putJson(url, data, options) {
        return rest.json(url, data, options, 'put');
    }

    self.putJson = function (url, data, options) {
        return new PromiseRetry(putJson, [makeUrl(url), data, makeOptions(options)], retryOpts)
            .then(extractData, logError);
    };
}

function StatusResult () {

    this.findStatusId = function () {
        return _.findWhere(this.links, {rel: "status"}).id;
    };

    this.findSelfId = function () {
        return _.findWhere(this.links, {rel: "self"}).id;
    };

}

},{"./../../config.js":83,"./promise-retry.js":87,"restling":"restling","underscore":"underscore"}],89:[function(require,module,exports){
var Predicate = require('./predicate.js');
var _ = require('./../underscore.js');

module.exports = {
    ContainsPredicate: ContainsPredicate,
    EqualPredicate: EqualPredicate,
    ArrayContainsPredicate: ArrayContainsPredicate,
    extractValue: extractValue,
    compareIgnoreCase: compareIgnoreCase,
    ExtractPredicate: ExtractPredicate,
    MatchPredicate: MatchPredicate
};


function ContainsPredicate (matchData, property) {
    var self = this;

    function contains (data) {
        if (property) {
            data = extractValue(data, property);
        }
        if (_.isString(matchData) && _.isString(data)) {
            return compareIgnoreCase(matchData, data);
        } else if (_.isArray(matchData) && _.isString(data)) {
            return _.filter(matchData,
                    function(value) {
                        return compareIgnoreCase(value, data);
                    }
                ).length > 0;
        } else {
            return false;
        }
    }

    Predicate.call(self, contains);
}

function ArrayContainsPredicate (matchData, property, ignoreCase) {
    var self = this;

    function contains (data) {
        if (data) {
            if (ignoreCase === true) {
                var matchDataUpperCase = _.each(_.asArray(matchData), _.partial(_, String.toUpperCase));
                return matchDataUpperCase.indexOf(extractValue(data, property).toUpperCase()) > -1;
            }
            return _.asArray(matchData).indexOf(extractValue(data, property)) > -1;
        }

        return false;
    }

    Predicate.call(self, contains);
}


function EqualPredicate (matchData, property) {
    var self = this;

    function equal (data) {
        return extractValue(data, property) === matchData;
    }

    Predicate.call(self, equal);
}

function MatchPredicate(criteriaValue, objectProperty) {
    var self = this;

    function match(data) {
        if (criteriaValue) {
            var found = _.filter(_.asArray(criteriaValue), function (value) {
                    return compareIgnoreCase(value, data[objectProperty]);
                }).length > 0;

            return found;
        }
        return true;
    }

    Predicate.call(self, match);
}

function extractValue(data, path) {
    if (!path || !data) {
        return data;
    }

    return _.reduce(path.split("."), function(memo, property) {
        return memo && memo[property];
    }, data);
}

function compareIgnoreCase(expected, actual) {
    if (_.isString(expected) && _.isString(actual)) {
        return actual.toUpperCase().indexOf(expected.toUpperCase()) > -1;
    }
    return false;
}

function ExtractPredicate(predicate, path) {
    var self = this;

    function extract(data) {
        return predicate.fn(extractValue(data, path));
    }

    Predicate.call(self, extract);
}

},{"./../underscore.js":97,"./predicate.js":90}],90:[function(require,module,exports){

var _ = require('underscore');

module.exports = Predicate;

function Predicate (predicateFn) {
    var self = this;

    self.fn = predicateFn;

    self.and = function (otherPredicate) {
        return new Predicate(function () {
            return predicateFn.apply(self, arguments) && otherPredicate.fn.apply(self, arguments);
        });
    };

    self.or = function (otherPredicate) {
        return new Predicate(function () {
            return predicateFn.apply(self, arguments) || otherPredicate.fn.apply(self, arguments);
        });
    };
}

Predicate.alwaysTrue = _.constant(new ConstPredicate(true));

Predicate.alwaysFalse = _.constant(new ConstPredicate(false));

Predicate.and = function () {
    return _.chain([arguments])
        .flatten()
        .reduce(function (memo, item) {
            return memo.and(item);
        }, Predicate.alwaysTrue())
        .value();
};

Predicate.or = function () {
    return _.chain([arguments])
        .flatten()
        .reduce(function (memo, item) {
            return memo.or(item);
        }, Predicate.alwaysFalse())
        .value();
};


function ConstPredicate (value) {
    var self = this;

    function init () {
        Predicate.call(self, _.constant(value));
    }

    init ();
}

},{"underscore":"underscore"}],91:[function(require,module,exports){
var _ = require('underscore');
var BasePredicate = require('./predicate.js');
var CommonPredicates = require('./common-predicates.js');

module.exports = BasePredicate;

BasePredicate.equalTo = function (value, property) {
    return new CommonPredicates.EqualPredicate(value, property);
};

BasePredicate.contains = function (value, property) {
    return new CommonPredicates.ContainsPredicate(value, property);
};

BasePredicate.equalToAnyOf = function (value, property, ignoreCase) {
    return new CommonPredicates.ArrayContainsPredicate(value, property, ignoreCase);
};

BasePredicate.extractValue = function (data, path) {
    return CommonPredicates.extractValue(data, path);
};

BasePredicate.compareIgnoreCase = function (expected, actual) {
    return CommonPredicates.compareIgnoreCase(expected, actual);
};

BasePredicate.extract = function(predicate, path) {
    return new CommonPredicates.ExtractPredicate(predicate, path);
};

BasePredicate.match = function(criteriaValue, objectProperty) {
    return new CommonPredicates.MatchPredicate(criteriaValue, objectProperty);
};

},{"./common-predicates.js":89,"./predicate.js":90,"underscore":"underscore"}],92:[function(require,module,exports){

var _ = require('underscore');
var Criteria = require('./criteria.js');
var CompositeCriteria = require('./composite-criteria.js');

module.exports = SearchCriteria;

function SearchCriteria (criteria, SingleCriteriaClass) {
    var self = this;
    var criteriaHelper = new Criteria(criteria);

    self.predicate = function (path) {
        var subCriteria = criteriaHelper.isComposite() ?
            new CompositeCriteria(criteria, SingleCriteriaClass) :
            new SingleCriteriaClass(criteria);

        return subCriteria.predicate(path);
    };

    self.parseCriteria = function() {
        if (criteriaHelper.isComposite()) {
            _.chain(_.keys(criteria))
                .each(function(key) {
                    criteria[key] = _.map(criteria[key], function(subcriteria) {
                        return new SearchCriteria(subcriteria, SingleCriteriaClass).parseCriteria();
                    });
                }).value();
        } else {
            criteria = new SingleCriteriaClass(criteria).parseCriteria();
        }
        return criteria;
    };
}
},{"./composite-criteria.js":93,"./criteria.js":94,"underscore":"underscore"}],93:[function(require,module,exports){

var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');

module.exports = CompositeCriteria;

/**
 * Represents composite search criteria.
 * @typedef CompositeCriteria
 * @type {object}
 *
 * @property {Array} or - the list of operands, that applies with OR operator.
 * @property {Array} and - the list of operands, that applies with AND operator.
 *
 * @example
 *
 * {
 *  or: [
 *          singleCriteriaObj1,
 *          singleCriteriaObj2
 *  ]
 * }
 *
 * @param criteria the search criteria
 * @param SingleCriteriaClass the class, that represents single search criteria
 * @constructor
 */
function CompositeCriteria(criteria, SingleCriteriaClass) {
    var self = this;
    var SearchCriteria = require('./common-criteria.js');

    self.predicate = function(path) {
        // extract only 1st criteria
        var compositeOperation = _.pairs(criteria)[0];
        var logicalOperator = compositeOperation[0];
        var operands = _.asArray(compositeOperation[1]);

        var defaultPredicate = selectDefaultPredicate(logicalOperator);

        return _.reduce(operands, function(predicate, operand) {
            return predicate[logicalOperator](new SearchCriteria(operand, SingleCriteriaClass).predicate(path));
        }, defaultPredicate);
    };

    function selectDefaultPredicate(operator) {
        return Predicate[operator === "and" ? 'alwaysTrue' : 'alwaysFalse']();
    }
}
},{"./../predicates/predicates.js":91,"./common-criteria.js":92,"underscore":"underscore"}],94:[function(require,module,exports){
var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');
var Filters = require('./filters.js');
var CompositeCriteria = require('./composite-criteria.js');
module.exports = Criteria;

function Criteria(criteria) {
    var self = this;
    var filters = new Filters(criteria);

    self.getFilters = function() {
        return filters;
    };

    self.isComposite = function() {
        return (criteria.hasOwnProperty('and') || criteria.hasOwnProperty('or'));
    };

    //extract more specific criteria from another
    self.extractSubCriteria = function(convertFilterCriteriaFn) {
        if (self.isComposite()) {
            return convertConditionalCriteria(criteria);
        }
        return convertFilterCriteriaFn(criteria);

        function convertConditionalCriteria(criteria) {
            //extract only 1st criteria
            var compositeOperation = _.pairs(criteria)[0];
            var logicalOperator = compositeOperation[0];
            var operands = _.asArray(compositeOperation[1]);


            var convertedOperands = _.map(operands, function(operand) {
                var converted;
                if (new Criteria(operand).isComposite()) {
                    converted = convertConditionalCriteria(operand);
                } else {
                    converted = convertFilterCriteriaFn(operand);
                }

                return converted;
            });

            var subCriteria = _.chain(convertedOperands)
                .compact()
                .value();

            if(_.isEmpty(subCriteria)) {
                return;
            }

            var result = {};
            result[logicalOperator] = subCriteria;
            return result;
        }
    };

    self.extractIdsFromCriteria = function(ids) {
        if (!ids) {
            ids = [];
        }
        if (self.isComposite()) {
            var compositeOperation = _.pairs(criteria)[0];
            var operands = _.asArray(compositeOperation[1]);
            return _.map(operands, function(operand) {
                return new Criteria(operand).extractIdsFromCriteria(ids);
            });
        }
        if (criteria.id) {
            return _.flatten(_.asArray(criteria.id, ids));
        }
        return ids;
    };

    self.parseSingleCriteria = function(singleCriteriaInstance, omitSecondCondition) {
        var criteriaRootProperty = singleCriteriaInstance.criteriaRootProperty;
        var propertiesMap = singleCriteriaInstance.criteriaPropertiesMap;
        var propertyCriteria = parsePropertiesCriteria(propertiesMap);

        var parsedCriteria = _.omit(criteria, _.values(propertiesMap));

        //transform criteria to Array
        var arrayCriteria = !parsedCriteria[criteriaRootProperty] ?
            _.asArray(propertyCriteria)
            : _.asArray(parsedCriteria[criteriaRootProperty], propertyCriteria);

        var nonEmptyOperands = _.filter(arrayCriteria, function(operand) {
            return !_.values(operand).every(_.isNull);
        });

        if (nonEmptyOperands.length > 0) {
            parsedCriteria[criteriaRootProperty] = (nonEmptyOperands.length === 1) ?
                nonEmptyOperands[0] :
                {or: nonEmptyOperands};
        }

        //if criteria is empty - should find overall
        //omitSecondCondition param - if provided, don't check second condition
        if (_.isEmpty(parsedCriteria) ||
           (!omitSecondCondition && _.isUndefined(parsedCriteria[criteriaRootProperty]))
        ) {
                parsedCriteria[criteriaRootProperty] = {};
        }

        return parsedCriteria;
    };

    function parsePropertiesCriteria(propertiesMap) {
        var result = {};

        _.each(propertiesMap, function(propertyName, key) {
            result[key] = getCriteriaValue(propertyName);
        });

        return result;
    }

    function getCriteriaValue(property) {
        if (criteria[property]) {
            if (typeof criteria[property] === 'function') {
                return criteria[property];
            }
            return _.asArray(criteria[property]);
        }
        return null;
    }
}
},{"./../predicates/predicates.js":91,"./composite-criteria.js":93,"./filters.js":95,"underscore":"underscore"}],95:[function(require,module,exports){
var _ = require('underscore');
var Predicate = require('./../predicates/predicates.js');

module.exports = Filters;

function Filters(criteria) {
    var self = this;

    self.byId = function() {
        if (criteria.id) {
            var ids = _.asArray(criteria.id)
                .map(function (value) {
                    return (value instanceof Object) ? value.id : value;
                });

            return Predicate.equalToAnyOf(ids, 'id');
        } else {
            return Predicate.alwaysTrue();
        }
    };

    self.byParamAnyOf = function(criteriaProperty, metadataProperty, ignoreCase) {
        if (metadataProperty === true || metadataProperty === false) {
            ignoreCase = metadataProperty;
            metadataProperty = undefined;
        }

        if (metadataProperty === undefined) {
            metadataProperty = criteriaProperty;
        }

        return criteria[criteriaProperty] &&
            Predicate.equalToAnyOf(_.asArray(criteria[criteriaProperty]), metadataProperty, ignoreCase) ||
            Predicate.alwaysTrue();
    };

    self.byCustomPredicate = function() {
        return criteria.where &&
            new Predicate(criteria.where) ||
            Predicate.alwaysTrue();
    };

    self.byParamMatch = function(criteriaProperty, metadataProperty) {
        return Predicate.match(criteria[criteriaProperty], metadataProperty);
    };

    self.byRootParam = function(SearchCriteriaClass, criteriaProperty, path) {
        if (path === undefined) {
            path = criteriaProperty;
        }

        return criteria[criteriaProperty] &&
            new SearchCriteriaClass(criteria[criteriaProperty]).predicate(path) ||
            Predicate.alwaysTrue();
    };


}
},{"./../predicates/predicates.js":91,"underscore":"underscore"}],96:[function(require,module,exports){

var _ = require('underscore');


module.exports = SearchSupport;

function SearchSupport () {
    var self = this;

    function getOnlySingleResult (result) {
        if (!result || result.length === 0) {
            throw new Error("Can't resolve any object");
        }

        if (result.length > 1) {
            throw new Error("Please specify more concrete search criteria");
        }

        return result[0];
    }

    function arrayToCompositeCriteria (array) {
        return array
            .reduce(function (prevItem, curItem) {
                return { or: [singleItemToCriteria(prevItem), singleItemToCriteria(curItem)] };
            });
    }

    function singleItemToCriteria(curItem) {
        if (curItem instanceof Array) {
            return arrayToCompositeCriteria(curItem);
        } else if (curItem instanceof Object) {
            return curItem;
        } else {
            throw new Error('Criteria (' + curItem + ') must be an object');
        }
    }

    self.findSingle = function (criteria) {
        return self.find(criteria).then(getOnlySingleResult);
    };

    self._searchCriteriaFrom = function (args) {
        var argsArray = _.flatten([args]);

        if (argsArray.length > 1) {
            return arrayToCompositeCriteria(argsArray);
        } else if (argsArray.length === 1) {
            return singleItemToCriteria(argsArray[0]);
        } else {
            return { };
        }
    };

}
},{"underscore":"underscore"}],97:[function(require,module,exports){

var _ = require('underscore');
var Promise = require('bluebird').Promise;

module.exports = _;

_.mixin({
    arrayPromise: function (promises) {
        return Promise.all(promises);
    },
    then: function (promise, successFn, errorFn) {
        return promise.then(successFn || _.noop, errorFn || _.noop);
    },
    asArray: function() {
        return _.flatten([arguments]);
    },
    applyMixin: function(Class, data) {
        if (data instanceof Array) {
            return _.map(_.asArray(data), function(arg) {
                return _.extend(Object.create(new Class()), arg);
            });
        }

        return _.extend(Object.create(new Class()), data);
    }
});
},{"bluebird":"bluebird","underscore":"underscore"}],98:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],99:[function(require,module,exports){
module.exports={
  "name": "clc-node-sdk",
  "version": "1.1.3",
  "description": "CenturyLink Cloud SDK for Node.js",
  "author": "Ilya Drabenia <ilya.drabenia@altoros.com>",
  "contributors": [
    "Aliaksandr Krasitski <aliaksandr.krasitski@altoros.com>",
    "Sergey Fedosenko <siarhei.fiadosenka@altoros.com>"
  ],
  "main": "./clc-sdk.js",
  "files": [
    "clc-sdk.js"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/CenturyLinkCloud/clc-node-sdk.git"
  },
  "bugs": {
    "url": "https://github.com/CenturyLinkCloud/clc-node-sdk/issues"
  },
  "keywords": [
    "ctl",
    "ctl.io",
    "clc",
    "centurylink",
    "cloud",
    "sdk",
    "api"
  ],
  "scripts": {
    "tests": "mocha --fgrep [UNIT]",
    "tests-watch": "watch \"npm run tests\" lib test",
    "integration-tests": "mocha --recursive test/*/*/*.js --fgrep [INTEGRATION]",
    "long-running-tests": "mocha --recursive test/*/*/*.js --fgrep \"[INTEGRATION, LONG_RUNNING]\"",
    "jshint": "jshint --verbose ./lib ./test",
    "jshint-watch": "watch \"npm run jshint\" lib test",
    "watch-all": "npm run tests-watch & npm run jshint-watch",
    "gen-docs": "node_modules\\.bin\\jsdoc -c conf.json",
    "tests-coverage": "istanbul cover ./node_modules/mocha/bin/_mocha -- -u exports -R spec --fgrep UNIT",
    "loc": "sloc --format cli-table --keys total,source,comment --exclude \"(node_modules\\.*|cassettes\\.*|docs\\.*|coverage\\.*|\\.*idea\\.*)\" ."
  },
  "dependencies": {
    "bluebird": "2.9.26",
    "restling": "0.9.1",
    "underscore": "1.8.3",
    "ip-subnet-calculator": "1.0.2",
    "moment": "2.10.3",
    "simple-ssh": "0.8.6"
  },
  "devDependencies": {
    "istanbul": "^0.3.17",
    "jsdoc": "^3.3.1",
    "jshint": "^2.8.0",
    "mocha": "^2.2.5",
    "nock-vcr-recorder-mocha": "^0.3.2",
    "path": "^0.12.7",
    "sloc": "^0.1.9",
    "watch": "^0.16.0",
    "browserify": "^11.2.0"
  },
  "license": "Apache-2.0"
}

},{}]},{},[]);

module.exports = require('clc-sdk');