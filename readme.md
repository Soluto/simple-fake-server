# simple-fake-server.js
A small, simple http server for mocking and asserting http calls.  
This server was developed mainly to isolate the client side code during automation and integration tests.  

+ [Installation](#installation)
+ [Usage Example](#usage-example)
+ [Defining Fake Routes](#defining-routes)
    + [Supported HTTP Methods](#supported-http-methods)
    + [Response](#response)
    + [Route Restrictions](#route-restrictions)
+ [Assertions](#assertions)
    + [Assertion Methods](#assertion-methods)
    + [Assertion Restrictions](#assertion-restrictions)
+ [More Usage Examples](#more-usage-examples)

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
    .withBody(object) // Route Restriction (optional). See Route Restrictions section.
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

### Route Restrictions

Restrictions are optional and can be defined after `to(path)`. **Only one** restriction can be set per route definition.  


* **`withBody(body: object)`**  
Will match only requests with content-type header set to 'application/json' and bodies that are objects that **deeply equal** the given body:

```js
const withBodyRoute = fakeServer.http.post().to('/some/path').withBody({ a: 1, b: 2 }).willSucceed();

// Request to /some/path with body { a: 1, b: 2 } => Success, 200 status code.
// Request to /some/path with body { a: 1, b: 2, c: 3 } => Fail, 400 status code.
```

* **`withBodyThatMatches(regex: string)`**   
Will match only requests with bodies that match the given **regex**.  
i.e. route defined with `withBodyThatMatches('[a-zA-Z]+$')` will accept request body `abc` but will reject `123`.

* **`withBodyThatContains(minimalBody: object)`**   
Will match only requests with content-type header set to 'application/json' and bodies that are *supersets* of the given minimal body.  
i.e. route defined with `withBodyThatContains({ a: 1, b: 2 })` will accept request body `{ a: 1, b: 2, c: 3}`.

* **`withQueryParams(queryParams: object)`**   
Will only match requests that match exactly the query params set on `queryParams`.  
i.e. route defined with `withQueryParams({ someQuery: true })` will match requests to `some/path?someQuery=true` but will reject `some/path?someQuery=false` or `some/path?someQuery=true&other=something`.

<br/><br/>
NOTE: a request that failed to fulfill a constrain will return 400 and will result in false when asserting with `hasMade` (more on this on the next section).

## Assertions

Each defined route exposes a `RouteCallTester` that can be accessed from `route.call`:

```js
let route = fakeServer.http.get().to('/some/path').willSucceed();

const routeCallTester = route.call;
```

### Assertion Methods

fakeServer instance exposes 3 methods that can be helpful for your tests assertions.

* **`hasMade(routeCallTester: RouteCallTester)`**   
Returns true/false, based on whether this route was called since the server was started.  
Usage example:
```js
var route = fakeServer.http.get().to('/your/api').willSucceed();

console.log(fakeServer.hasMade(route.call)); // false
await fetch('/your/api', { method: 'GET' });
console.log(fakeServer.hasMade(route.call)); // true
```

* **`callsMade(routeCallTester: RouteCallTester)`**  
Returns an array of all calls made to the provided route.   
Each entry of the array is an object containing `method`, `path`, `headers` and `body`.

* **`clearCallHistory()`**  
Self explanatory. After calling clearCallHistory hasMade will always return false and callsMade will always return an empty array.

### Assertion Restrictions

It's possible to chain some restrictions to the routeCallTester. It's useful when the route was defined with a regex or a body constrain and you want to make sure *exactly* what was the route called with.

* **`withPath(specificPath: string)`**  
Comes useful when defining a route with regex and you'd like to assert a specific path was called.  
Usage example:

```js
const route = fakeServer.http.get().to('/some/path/[a-zA-Z]+$').willSucceed();
await fetch('/some/path/xyz', { method: 'GET' });

console.log(fakeServer.hasMade(route.call.withPath('/some/path/xyz'))); // true
console.log(fakeServer.hasMade(route.call.withPath('/some/path/abc'))); // false
```

* **`withBodyText(text: string)`**  
Comes useful when defining a route with `withBodyThatMatches` using regex and you'd like to assert a specific body text was called with.  

* **`withSpecificBody(body: object)`**  
Comes useful when defining a route with `withBodyThatContains` and you'd like to assert a specific body object was called with.  

## More Usage Examples

You can check out our tests section to see a bunch of different usage examples.

* [General Route Matching](./__tests__/route-matching-general-tests.ts)
* [Body Restrictions](./__tests__/body-restrictions-on-route-definition-tests.ts)
* [Assertion Restrictions](./__tests__/body-restrictions-on-assertion-tests.ts)