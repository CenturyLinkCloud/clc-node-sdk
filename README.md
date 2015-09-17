
Documentation
-------------
See the [wiki](https://github.com/CenturyLinkCloud/clc-node-sdk/wiki) for CLC Node.js SDK getting-started and user guides.
Also you can run `npm run gen-docs` and see generated documentation in `/docs.index.html`.

Requirements
-------------
* Node.js 0.12 (or later)

Build process details
---------------------
To build the CLC SDK source, issue the following commands:

```
$ git clone git@github.com:CenturyLinkCloud/clc-node-sdk.git
$ cd clc-node-sdk
$ npm install
```

Configuration details
---------------------

Please see the [SDK configuration](https://github.com/CenturyLinkCloud/clc-node-sdk/wiki/2.7-SDK-configuration)
section for details and examples of how to configure the CLC SDK.

Example
-------
This example shows some of the functionality supported by the CLC Node.js SDK.

```js
```

Testing
-------

Issue the following command to test the SDK.

`mocha --recursive test/**/*.js --clc.username=<USERNAME> --clc.password=<PASSWORD>`


##Unit Tests

The SDK contains unit tests that you can run with the following command.

```bash
npm run tests
```

##Unit Tests with Coverage

There are also unit tests with coverage that you can run.

```bash
npm run tests-coverage
```

##Integration Tests

To run integration tests, issue the following command.

```bash
export CLC_USERNAME=<USERNAME>
export CLC_PASSWORD=<PASSWORD>
npm run integration-tests
```

##Long Running Tests

The long-running SDK tests can be run using the following command.

```bash
export CLC_USERNAME=<USERNAME>
export CLC_PASSWORD=<PASSWORD>
npm run long-running-tests
```

License
-------
This project is licensed under the [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0.html).
