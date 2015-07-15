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