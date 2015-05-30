
var rest = require('restling');

function LoginClient () {
    var self = this;

    self.login = function (username, password) {
        return rest
            .postJson(
                'https://api.ctl.io/v2/authentication/login',
                { username: username, password: password }
            )
            .then(function (result) {
                return result.data;
            }, function (e) {
                console.log(e);
            });
    };
}

module.exports = new LoginClient();