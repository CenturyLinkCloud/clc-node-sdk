
var CommandLineCredentialsProvider = require('./core/auth/credentials-provider.js').CommandLineCredentialsProvider;
var EnvironmentCredentialsProvider = require('./core/auth/credentials-provider.js').EnvironmentCredentialsProvider;
var AuthenticatedClient = require('./core/client/authenticated-client.js');
var ComputeServices = require('./base-services/base-services.js');
var BaseServices = require('./base-services/base-services.js');
var _ = require('underscore');


module.exports = ClcSdk;

function ClcSdk () {
    var self = this;
    var username;
    var password;

    function init () {
        if (arguments.length >= 2 &&
                typeof(arguments[0]) === 'string' &&
                typeof(arguments[1]) === 'string') {
            initWithCredentials(arguments[0], arguments[1], arguments.length > 2 && arguments[2]);
            return;
        }

        if (arguments.length > 1 && arguments[0] instanceof Object) {
            initWithCredentialsProvider(arguments[0], arguments.length >= 2 && arguments[1]);
            return;
        }

        initWithDefaultCredentialsProvider();
    }

    function initWithCredentials(usernameVal, passwordVal, options) {
        username = usernameVal;
        password = passwordVal;
    }

    function initWithCredentialsProvider(credentialsProvider, options) {
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

    function clientOptions () {
        return { };
    }

    self.authenticatedClient = _.memoize(function () {
        return new AuthenticatedClient(
            username,
            password,
            clientOptions()
        );
    });

    self.baseServices = _.memoize(function () {
        return new BaseServices(self.authenticatedClient);
    });

    self.computeServices = _.memoize(function () {
        return new ComputeServices(self.authenticatedClient);
    });

    init ();
}