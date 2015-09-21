
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
var Sdk = require('clc-sdk');
var sdk = new Sdk('user', 'password');

function example() {
    sdk.computeServices().servers().create(
        {
            name: 'testsrv',
            description: 'my first server',
            group: {
                dataCenter: sdk.computeServices().DataCenter.DE_FRANKFURT,
                name: sdk.computeServices().Group.DEFAULT
            },
            template: {
                dataCenter: sdk.computeServices().DataCenter.DE_FRANKFURT,
                operatingSystem: {
                    family: sdk.computeServices().OsFamily.CENTOS,
                    version: "6",
                    architecture: sdk.computeServices().Machine.Architecture.X86_64
                }
            },
            network: {
                primaryDns: "172.17.1.26",
                secondaryDns: "172.17.1.27"
            },
            machine: {
                cpu: 1,
                memoryGB: 1
            }
        }
    )
    .then(function(serverRef) {
        return sdk.computeServices().sercers().findSingle(serverRef);
    })
    .then(function(serverMetadata) {
        console.log(serverMetadata.details);
    });
}

example();
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
