"use strict";

var fs = require('fs');
var browserify = require("browserify");
var path = require("path");
var version = require("../package.json").version;

var srcDir = path.join(__dirname, "../lib");
var dstFilePath = path.join(__dirname, "../clc-sdk.js");

var externalDeps = [
    'underscore',
    'restling',
    'bluebird',
    'moment',
    'events',
    'util',
    'ip-subnet-calculator',
    'simple-ssh'
];


function buildSdk() {
    var bundle = browserify();

    bundle.require(srcDir + "/clc-sdk.js", { expose: "clc-sdk" });

    externalDeps.forEach(function (curDep) { bundle.external(curDep) });

    return bundle.bundle(enhanceSdkCode(saveToFile));
}

function enhanceSdkCode(saveFn) {
    return function (err, bundledSdkCode) {
        var wrapped = [
            "/*! Version: " + version + " */",
            bundledSdkCode,
            "module.exports = require('clc-sdk');"
        ];

        saveFn(err, wrapped.join('\n'));
    };
}

function saveToFile (err, src) {
    fs.writeFile(dstFilePath, src);
}

buildSdk();
