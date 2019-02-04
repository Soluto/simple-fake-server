# simple-fake-server.js
A small, simple http server for mocking and asserting http calls.  
This server was developed mainly to isolate the client side code during automation (selenium) tests.  

+ [Installation](#installation)
+ [Usage Example](#usage-example)
+ [Defining Fake Routes](#defining-routes)
    + [Supported HTTP Methods](#supported-http-methods)
    + [Response](#response)
    + [Restrictions](#restrictions)

## Installation
`npm install simple-fake-server --save-dev`

## Usage Example
```js
import { FakeServer } from 'simple-fake-server');

describe('Test Example', () => {
    let fakeServer;
    
    before(() => {
        fakeServer = new FakeServer(1234);
        fakeServer.start(); //The FakeServer now listens on http://localhost:1234
    });

    it('Does something', async () => {
        var route = fakeServer.http.get().to('/your/api').willReturn({ message: "hello world" });

        const response = await fetch('http://localhost:1234/your/api', { method: 'GET' });
        const body = await response.json();

        expect(response.status).toEqual(200);
        expect(body.message).toEqual("hello world");
        expect(fakeServer.hasMade(route.call)).toEqual(true);
    });

    after(() => {
        fakeServer.stop(); // stop listening
    });
});
```

## Defining Routes

```js
let route = fakeServer.http
    .get()  // Http Method (mandatory). See Supported HTTP Methods section.
    .to(pathRegex) // Route Path (mandatory). May be regex
    .withBody(object) // Route Restriction (optional). See Restrictions section.
    .willSucceed() // Route Response (mandatory). See Response Section
```

### Supported HTTP Methods

The following http methods are available under `fakeServer.http`:  
* get()
* post()
* put()
* delete()
* patch()

### Response

Response is mandatory and need to be set on any defined route.

* **`willSucceed()`** - a request to route that was defined with willSucceed will return status code 200 and `{}` body.

* **`willFail(errorStatusCode?: number)`** - a request to route that was defined with willFail will return status code `errorStatusCode` (default is 500 if none provided) and `{}` body.

* **`willReturn(response: any, statusCode?: number)`** - a request to route that was defined with willReturn will return status code `statusCode` (default is 200 if none provided) and `response` body.

### Restrictions

Restrictions are optional and can be defined after `to(path)`. **Only one** restriction can be set per route definition.  


* **`withBody(object)`**  
Will match only requests with content-type header set to 'application/json' and bodies that are objects that **deeply equal** the given object:

```js
const withBodyRoute = fakeServer.http.post().to('/some/path').withBody({ a: 1, b: 2 }).willSucceed();
```

  On this example request with body of `{ a: 1, b: 2 }` will succeed with status 200 while `{ a: 1, b: 2, c: 3 }` will fail with status 400.

* **`withBodyThatMatches(regex)`**   
Will match only requests with bodies that match the given **regex**.  
i.e. route defined with `withBodyThatMatches('[a-zA-Z]+$')` will accept request body `abc` but will reject `123`.

* **`withBodyThatContains(minimalObject)`**   
Will match only requests with content-type header set to 'application/json' and bodies that are *supersets* of the given minimal object.  
i.e. route defined with `withBodyThatContains({ a: 1, b: 2 })` will accept request body `{ a: 1, b: 2, c: 3}`.

* **`withQueryParams(queryParamsObject)`**   
Will only match requests that match exactly the query params set on `queryParamsObject`.  
i.e. route defined with `withQueryParams({ someQuery: true })` will match requests to `some/path?someQuery=true` but will reject `some/path?someQuery=false` or `some/path?someQuery=true&other=something`.

<br/><br/>
NOTE: a request that failed to fulfill a constrain will return 400 and won't return true when asserting `hasMade` (more on this on next section.)

## Assertions

Each defined route exposes a `RouteCallTester` that can be accessed from `route.call`:

```js
let route = fakeServer.http.get().to('/some/path/[a-zA-Z]+$').willSucceed();

const routeCallTester = route.call;
```
 
You can use `withPath(specificPath)` to make the test specific to a certain path, rather than the whole path regex:
```js
fakeServer.hasMade(route.call.withPath('/some/path/abc'));
```


### When Testing If Route Was Called

After the route is defined, you can test if there were any calls made to the route with a *specific* body.

`withBodyText(str);` will restrict `hasMade()` to return true only if there were any requests to the route with a body that equals the *specific* string `str`.
It can be called only if route was defined with no body restriction or if the route was defined with a regex body restriction (using `withBodyThatMatches(regex)`) and `str` matches the regex.

```js
const route1 = fakeServer.http.post().to('/some/path').willSucceed();
const route2 = fakeServer.http.post().to('/some/path').withBodyThatMatches('[a-zA-Z]+$').willSucceed();

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
const route1 = fakeServer.http.post().to('/some/path').willSucceed();
const route2 = fakeServer.http.post().to('/some/path').withBodyThatContains({ a: 1, b: 2 }).willSucceed();

// posting a request to '/some/path' with content-type header set to 'application/json' and body JSON.stringify({ a: 1, b: 2, c: 3 })...

fakeServer.hasMade(route1.call.withSpecificBody({ a: 1, b: 2 })).should.equal(false);
fakeServer.hasMade(route2.call.withSpecificBody({ a: 1, b: 2 })).should.equal(false);
fakeServer.hasMade(route1.call.withSpecificBody({ c: 3, b: 2, a: 1 })).should.equal(true);
fakeServer.hasMade(route2.call.withSpecificBody({ c: 3, b: 2, a: 1 })).should.equal(true);

route2.call.withSpecificBody({ a: 1, c: 3 }); // throws exception - specific body is not a superset of the minimal object
```

More examples can be found in this project's tests.