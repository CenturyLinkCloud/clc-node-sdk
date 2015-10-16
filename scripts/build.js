"use strict";

var fs = require('fs');
var browserify = require("browserify");
var path = require("path");
var version = require("../package.json").version;

var srcDir = path.join(__dirname, "../lib");
var dstFilePath = path.join(__dirname, "../clc-sdk.js");


function buildSdk() {
    var bundle = browserify();

    bundle.require(srcDir + "/clc-sdk.js", { expose: "clc-sdk" });
    bundle.external('underscore');
    bundle.external('restling');
    bundle.external('bluebird');
    bundle.external('moment');
    bundle.external('events');
    bundle.external('util');
    bundle.external('ip-subnet-calculator');
    bundle.external('simple-ssh');

    return bundle.bundle(correctCode(saveToFile));
}

function correctCode(saveFn) {
    return function (err, src) {
        var wrapped = [
            "/*! Version: " + version + " */",
            src,
            "module.exports = require('clc-sdk');"
        ];

        saveFn(err, wrapped.join('\n'));
    };
}

function saveToFile (err, src) {
    fs.writeFile(dstFilePath, src);
}

buildSdk();
