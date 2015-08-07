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
                pass: opts.credentials.password
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
                exit: function(code) {
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
            fail: function() {
                console.err("Cannot connect to " + client.server.id);
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