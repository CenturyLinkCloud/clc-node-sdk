
var CommandLineCredentialsProvider = require('./core/auth/credentials-provider.js').CommandLineCredentialsProvider;
var AuthenticatedClient = require('./core/client/authenticated-client.js');
var ComputeServices = require('./compute-services/compute-services.js');
var CommonServices = require('./common-services/common-services.js');
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

    self.commonServices = _.memoize(function () {
        return new CommonServices(self.authenticatedClient);
    });

    self.computeServices = _.memoize(function () {
        return new ComputeServices(self.authenticatedClient);
    });

    init ();
}