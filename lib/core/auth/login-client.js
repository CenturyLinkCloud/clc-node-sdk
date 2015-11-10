
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