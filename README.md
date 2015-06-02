This is Node SDK for CenturyLink Cloud.

Testing
-------
`mocha --recursive test/**/*.js --clc.username=<USERNAME> --clc.password=<PASSWORD>`

##Unit Tests
npm run tests

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
