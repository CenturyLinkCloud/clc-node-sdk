"use strict";

var fs = require('fs');
var browserify = require("browserify");
var path = require("path");
var version = require("../package.json").version;

var entrySrcFilePath = path.join(__dirname, "../lib/clc-sdk.js");
var dstFilePath = path.join(__dirname, "../clc-sdk.js");


function buildSdk () {
    var bundle = browserify();

    defineEntryPoint(bundle, entrySrcFilePath);

    excludeExternalDeps(bundle);

    bundle.bundle(
        enhanceSdkCode(saveToFile)
    );
}

function defineEntryPoint (bundle, entrySrcFilePath) {
    bundle.require(entrySrcFilePath, { expose: "clc-sdk" });
}

function excludeExternalDeps (bundle) {
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

    externalDeps.forEach(function (curDep) {
        bundle.external(curDep);
    });
}

function wrapSdkCode (bundledSdkCode) {
    var wrap = [
        "/*! Version: " + version + " */",
        bundledSdkCode,
        "module.exports = require('clc-sdk');"
    ];

    return wrap.join('\n');
}

function enhanceSdkCode (saveFn) {
    return function (err, bundledSdkCode) {
        saveFn(err, wrapSdkCode(bundledSdkCode));
    };
}

function saveToFile (err, src) {
    fs.writeFile(dstFilePath, src);
}

buildSdk();
