# Simple-fake-server.js
A small, simple http server for mocking and asserting http calls.  
This server was developed mainly to isolate the client side code during automation (selenium) tests.  

## Installation
`npm install simple-fake-server --save-dev`

## Example Usage
```javascript
const chai = require('chai');
chai.should();
const fakeServer = require('simple-fake-server').fakeServer;
const http = require('simple-fake-server').httpFakeCalls;

describe('Home Page', () => {
    before(() => {
        fakeServer.start(1234); // the fake server now listens on http://localhost:1234
    });

    it('Displays the list of existing partners', () => {
        http.get().to('/your/api').willReturn({ message: "hello world" });

        return fetch('http://localhost:1234/your/api', { method: 'GET' })
            .then(res => res.json())
            .then(j => {
                j.message.should.eqaul("hello world")
            });
    });

    after(() => {
        fakeServer.stop(); // stop listening
    });
});
```
## API
`let verbSpec = http.create(verb)` is the main method used to define a mock. You can use any verb (GET, POST etc.).  
Currently there are 3 different helper methods - http.get(), http.put(), and http.post(), which just pass the relavent verb to the http.create() method.  

`let pathSpec = verbSpec.to(regex)` is used to match the request url.  
`let pathWithPayloadSpec = pathSpec.withPayload(payloadRegex)` is used to match requests only if their body matches the provided regex.
`pathSpec.willReturn(response)` sets the response that the fake server will return for requests matching the path spec  
`pathSpec.willSucceed()` return status code 200 with no body for requests matching the path spec  
`pathSepc.willFail(errorStatusCode)` return an error response with the provided status code



