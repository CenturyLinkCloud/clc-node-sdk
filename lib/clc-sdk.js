
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
            initWithCredentials(args[0], args[1], args.length > 2 && args[2]);
            return;
        }

        if (args.length > 1 && args[0] instanceof Object) {
            initWithCredentialsProvider(args[0], args.length >= 2 && args[1]);
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

    // TODO: need to implement chaining of credentials providers
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