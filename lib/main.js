//
//var rest = require('restling');
//
//rest
//    .postJson(
//        'https://api.ctl.io/v2/authentication/login',
//        {username: 'idrabenia', password: 'Lyceum31101989'}
//    )
//    .then(function (result) {
//        console.log(result.data);
//    });

var AuthenticatedClient = require('./core/client/authenticated-client.js');
var ServerClient = require('./servers/server-client.js');

new ServerClient(new AuthenticatedClient('idrabenia.altd', 'RenVortEr9'))
    .findServerById('DE1ALTDCTTL577')
    .then(function (server) {
        console.log(server);
    });

var DataCenterClient = require('./../lib/common-management/datacenter-client.js');

new DataCenterClient(new AuthenticatedClient('idrabenia.altd', 'RenVortEr9'))
    .findAllDataCenters()
    .then(function (dataCenters) {
        console.log(dataCenters);
    });

