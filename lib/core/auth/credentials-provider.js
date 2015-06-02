
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
        username = process.env.CLC_USERNAME;
        password = process.env.CLC_PASSWORD;
    }

    self.getUsername = function () {
        return username;
    };

    self.getPassword = function () {
        return password;
    };

    init();
}