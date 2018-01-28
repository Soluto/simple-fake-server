# simple-fake-server.js
A small, simple http server for mocking and asserting http calls.  
This server was developed mainly to isolate the client side code during automation (selenium) tests.  

## Installation
`npm install simple-fake-server --save-dev`

## Usage Example
```js
const chai = require('chai');
chai.should();
const FakeServer = require('simple-fake-server').FakeServer;
const httpFakeCalls = require('simple-fake-server').httpFakeCalls;

describe('Home Page', () => {
    let fakeServer;
    let http;
    
    before(() => {
        fakeServer = new FakeServer(1234);
        fakeServer.start(); // the fake server now listens on http://localhost:1234
        http = httpFakeCalls(fakeServer);
    });

    it('Does something', () => {
        var route = http.get().to('/your/api').willReturn({ message: "hello world" });

        return fetch('http://localhost:1234/your/api', { method: 'GET' })
            .then(res => res.json())
            .then(j => {
                j.message.should.eqaul("hello world")
            })
            .then(() => {
                fakeServer.hasMade(route.call).should.equal(true);
            });
    });

    after(() => {
        fakeServer.stop(); // stop listening
    });
});
```

## Defining Routes

```js
let verbSpec = http.get();  // or http.post() or http.put() - is used to match the request's verb.
let pathSpec = verbSpec.to(pathRegex); // is used to match the request url.  
pathSpec.willReturn(response); // sets the response that the fake server will return for requests matching the path spec.  
pathSpec.willSucceed(); // returns status code 200 with no body for requests matching the path spec.  
pathSepc.willFail(errorStatusCode); // returns an error response with the provided status code.
```

Those methods can be chained:
```js
http.get().to('/some/path').willSucceed();
```

## Testing If Route Was Called

`willReturn()`, `willSucceed()` and `willFail()` return a route call tester object which will allow you to check if calls to that route have been made:

```js
let route = http.get().to('/some/path/[a-zA-Z]+$').willSucceed();
fakeServer.hasMade(route.call); // returns true/false, based on weather this route was called since the server was started.
```
 
You can use `withPath(specificPath)` to make the test specific to a certain path, rather than the whole path regex:
```js
fakeServer.hasMade(route.call.withPath('/some/path/abc'));
```

## Body Restrictions

### When Defining a Route

When you define a route, you may set a body restriction. Requests with body that does not match the restriction will not be matched.

`withBodyThatMatches(regex)` will match only requests with bodies that match the given regex:

```js
const route1 = http.post().to('/some/path').withBodyThatMatches('[a-zA-Z]+$').willSucceed();
const route2 = http.post().to('/some/path').withBodyThatMatches('[0-9]+$').willSucceed();

// posting a request to '/some/path' with the body 'abc'...

fakeServer.hasMade(route1.call).should.equal(true);
fakeServer.hasMade(route2.call).should.equal(false);
```

`withBodyThatContains(minimalObject)` will match only requests with content-type header set to 'application/json' and bodies that are *supersets* of the given minimal object:

```js
const route1 = http.post().to('/some/path').withBodyThatContains({ a: 1, b: 2 }).willSucceed();
const route2 = http.post().to('/some/path').withBodyThatContains({ a: 1, b: 2, c: 3 }).willSucceed();
const route3 = http.post().to('/some/path').withBodyThatContains({ a: 1, b: 2, c: 3, d: 4 }).willSucceed();

// posting a request to '/some/path' with content-type header set to 'application/json' and the body JSON.stringify({ b: 2, a: 1, c: 3 })...

fakeServer.hasMade(route1.call).should.equal(true);
fakeServer.hasMade(route2.call).should.equal(true);
fakeServer.hasMade(route3.call).should.equal(false);
```

`withBody(object)` will match only requests with content-type header set to 'application/json' and bodies that are objects that *deeply equal* the given object:

```js
const route1 = http.post().to('/some/path').withBody({ a: 1, b: 2 }).willSucceed();
const route2 = http.post().to('/some/path').withBody({ a: 1, b: 2, c: 3 }).willSucceed();
const route3 = http.post().to('/some/path').withBody({ a: 1, b: 2, c: 3, d: 4 }).willSucceed();

// posting a request to '/some/path' with content-type header set to 'application/json' and the body JSON.stringify({ b: 2, a: 1, c: 3 })...

fakeServer.hasMade(route1.call).should.equal(false);
fakeServer.hasMade(route2.call).should.equal(true);
fakeServer.hasMade(route3.call).should.equal(false);
```

### When Testing If Route Was Called

After the route is defined, you can test if there were any calls made to the route with a *specific* body.

`withBodyText(str);` will restrict `hasMade()` to return true only if there were any requests to the route with a body that equals the *specific* string `str`.
It can be called only if route was defined with no body restriction or if the route was defined with a regex body restriction (using `withBodyThatMatches(regex)`) and `str` matches the regex.

```js
const route1 = http.post().to('/some/path').willSucceed();
const route2 = http.post().to('/some/path').withBodyThatMatches('[a-zA-Z]+$').willSucceed();

// posting a request to '/some/path' with the body 'abc'...

fakeServer.hasMade(route1.call.withBodyText('xyz')).should.equal(false);
fakeServer.hasMade(route2.call.withBodyText('xyz')).should.equal(false);
fakeServer.hasMade(route1.call.withBodyText('abc')).should.equal(true);
fakeServer.hasMade(route2.call.withBodyText('abc')).should.equal(true);

route2.call.withBodyText('123'); // throws exception - specific string does not match the regex
```

`withSpecificBody(obj);` will restrict `hasMade()` to return true only if there were any requests to the route with content-type header set to 'application/json' the body deeply equals the *specific* object `obj`.
It can be called only if route was defined with no body restriction or if the route was defined with a minimal object body restriction (using `withBodyThatContains(minimalObject)`) and `obj` is a superset of the minimal object.

```js
const route1 = http.post().to('/some/path').willSucceed();
const route2 = http.post().to('/some/path').withBodyThatContains({ a: 1, b: 2 }).willSucceed();

// posting a request to '/some/path' with content-type header set to 'application/json' and body JSON.stringify({ a: 1, b: 2, c: 3 })...

fakeServer.hasMade(route1.call.withSpecificBody({ a: 1, b: 2 })).should.equal(false);
fakeServer.hasMade(route2.call.withSpecificBody({ a: 1, b: 2 })).should.equal(false);
fakeServer.hasMade(route1.call.withSpecificBody({ c: 3, b: 2, a: 1 })).should.equal(true);
fakeServer.hasMade(route2.call.withSpecificBody({ c: 3, b: 2, a: 1 })).should.equal(true);

route2.call.withSpecificBody({ a: 1, c: 3 }); // throws exception - specific body is not a superset of the minimal object
```

More examples can be found in this project's tests.