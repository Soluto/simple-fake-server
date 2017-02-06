# Simple-fake-server.js
A small, simple http server for mocking and asserting http calls.  
This server was developed mainly to isolate the client side code during automation (selenium) tests.  

## Installation
`npm install simple-fake-server --save-dev`

## Usage Example
```javascript
const chai = require('chai');
chai.should();
const fakeServer = require('simple-fake-server').fakeServer;
const http = require('simple-fake-server').httpFakeCalls;

describe('Home Page', () => {
    before(() => {
        fakeServer.start(1234); // the fake server now listens on http://localhost:1234
    });

    it('Does something', () => {
        var route = http.get().to('/your/api').willReturn({ message: "hello world" });

        return fetch('http://localhost:1234/your/api', { method: 'GET' })
            .then(res => res.json())
            .then(j => {
                j.message.should.eqaul("hello world")
            })
            .then(() => {
                route.call.hasBeenMade().should.equal(true);
            });
    });

    after(() => {
        fakeServer.stop(); // stop listening
    });
});
```

## Defining Routes

`let verbSpec = http.get();  // or http.post() or http.put()` is used to match the request's verb.
`let pathSpec = verbSpec.to(pathRegex);` is used to match the request url.  
`let pathWithBodySpec = pathSpec.withBodyThatMatches(bodyRegex);` is used to match requests only if their body matches the provided regex.  
`pathSpec.willReturn(response);` sets the response that the fake server will return for requests matching the path spec.  
`pathSpec.willSucceed();` return status code 200 with no body for requests matching the path spec.
`pathSepc.willFail(errorStatusCode);` return an error response with the provided status code.

Those methods could be chained:
`http.get().to('/some/path').withBodyThatMatches('{"message":"[a-zA-Z]+"}').willSucceed()`

## Testing If Route Was Called

`willReturn()`, `willSucceed()` and `willFail()` return a route call tester object which will allow you to check if calls to that route have been made:

`let route = http.get().to('/some/path/[a-zA-Z]+$').withBodyThatMatches('{"message":"[a-zA-Z]+"}').willSucceed();`

`route.call.hasBeenMade();` returns true/false, based on weather this route was called since the server was started.
 
You can use `withPath(specificPath)` to make the test specific to a certain path, rather than the whole path regex:
`route.call.withPath('/some/path/abc').hasBeenMade();`

Similarly, you can use `withBody(specificBody)` to make the test specific to a certain body, rather than the whole body regex:
`route.call.withBody(JSON.stringify({ message: 'hi' })).hasBeenMade();`

Chaining `withPath()` and `withBody()` is possible too:
`route.call.withPath('/some/path/abc').withBody(JSON.stringify({ message: 'hi' })).hasBeenMade();`