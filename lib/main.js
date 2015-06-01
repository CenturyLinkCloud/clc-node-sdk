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

//var AuthenticatedClient = require('./core/client/authenticated-client.js');
//var ServerClient = require('./servers/server-client.js');
//
//new ServerClient(new AuthenticatedClient('idrabenia.altd', 'RenVortEr9'))
//    .findServerById('DE1ALTDCTTL577')
//    .then(function (server) {
//        console.log(server);
//    });
//
//var DataCenterClient = require('./../lib/common-management/datacenter-client.js');
//
//new DataCenterClient(new AuthenticatedClient('idrabenia.altd', 'RenVortEr9'))
//    .findAllDataCenters()
//    .then(function (dataCenters) {
//        console.log(dataCenters);
//    });

var crypto = require('crypto');
var fs = require('fs');
var zlib = require('zlib');
var Buffer = require('buffer').Buffer;

var password = new Buffer(process.env.PASS || 'password');
var encryptStream = crypto.createCipher('aes-256-cbc', password);

var gzip = zlib.createGzip();
//var readStream = fs.createReadStream('clc-sdk.js'); // current file
//var writeStream = fs.createWriteStream('out.gz');

//readStream   // reads current file
//  .pipe(encryptStream) // encrypts
//  .pipe(gzip)  // compresses
//  .pipe(writeStream)  // writes to out file
//  .on('finish', function () {  // all done
//    console.log('done');
//  });

//readStream = fs.createReadStream('clc-sdk.js', {encoding: 'utf-8'});
//
//readStream
//    .on('data', function (data) {
//        console.log(data);
//    });

var stream = require('stream');
var Readable = stream.Readable;
var Writable = stream.Writable;
var Transform = stream.Transform;

inStream = new Readable();
inStream.setEncoding('utf-8');

outStream = new Writable({decodeStrings: false});
outData = '';
outStream._write = function (chunk, enc, next) {
   outData += chunk.toString(enc);
   next();
};
outStream.on('finish', function () {
    console.log(outData);
});

upperTransformer = new Transform({ objectMode: true });
upperTransformer._transform = function (chunk, encoding, done) {
    this.push(chunk.toString('utf8').toUpperCase());
    done();
};

inStream.push('a');

var data = [];
inStream
    .on('data', function (chunk) {
        data += chunk;
    })
    .on('end', function () {
        console.log(data);
    })
    .pipe(upperTransformer)
    .pipe(outStream);

inStream.push('b');
inStream.push(null);
