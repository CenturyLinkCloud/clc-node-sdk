
Documentation
-------------
See the [wiki](https://github.com/CenturyLinkCloud/clc-node-sdk/wiki) for CLC Node.js SDK getting-started and user guides.
Also you can run `npm run gen-docs` and see generated documentation in `/docs.index.html`.

Build process details
---------------------
To build sources, you need to install Node.js 0.12 or later. To check out and build the CLC SDK source, issue the following commands:

```
$ git clone git@github.com:CenturyLinkCloud/clc-node-sdk.git
$ cd clc-node-sdk
$ npm install
```

Configuration details
---------------------

Please see the [SDK configuration](https://github.com/CenturyLinkCloud/clc-node-sdk/wiki/2.11-SDK-configuration)
section for details and examples of how to configure the CLC SDK.

Example
-------
This example shows some of the functionality supported by the CLC Node.js SDK.

```js
```

Testing
-------
`mocha --recursive test/**/*.js --clc.username=<USERNAME> --clc.password=<PASSWORD>`


##Unit Tests
```bash
npm run tests
```

##Unit Tests with Coverage
```bash
npm run tests-coverage
```

##Integration Tests
```bash
export CLC_USERNAME=<USERNAME>
export CLC_PASSWORD=<PASSWORD>
npm run integration-tests
```

##Long Running Tests
```bash
export CLC_USERNAME=<USERNAME>
export CLC_PASSWORD=<PASSWORD>
npm run long-running-tests
```

License
-------
This project is licensed under the [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0.html).
