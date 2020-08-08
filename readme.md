# simple-fake-server


A small, simple http server for mocking and asserting http calls.


-   [Installation](#installation)
-   [Usage Example](#usage-example)
-   [Defining Fake Routes](#defining-routes)
-   [Running Inside a Docker Container](#Running-Inside-a-Docker-Container)
-   [Supported HTTP Methods](#supported-http-methods)
-   [Response](#response)
-   [Route Restrictions](#route-restrictions)
-   [Assertions](#assertions)
    -   [Assertion Methods](#assertion-methods)
    -   [Assertion Constrains](#assertion-constrains)
-   [More Usage Examples](#more-usage-examples)

## Installation

`npm install simple-fake-server --save-dev`  
or  
`yarn add simple-fake-server`

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
        const route = fakeServer.get('/your/api').willReturn({ message: "hello world" });

        const response = await fetch('http://localhost:1234/your/api', { method: 'GET' });
        const body = await response.json();

        expect(response.status).toEqual(200);
        expect(body.message).toEqual("hello world");
        expect(fakeServer.didReceive(route.call)).toEqual(true);
    });

    after(() => {
        fakeServer.stop(); // stop listening
    });
});
```

## Running Inside a Docker Container

see [simple-fake-server-host](http-host/README.md)

## Defining Routes

```js
const route = fakeServer
    .get(pathRegex) // Http Method and route (route may be a regex). See Supported HTTP Methods section.
    .withBody(object) // Route Restriction (optional). The server will only respond to requests matching the restriction. See Route Restrictions section for more info.
    .willSucceed(); // Route Response (mandatory). See Response Section for more info.
```

### Supported HTTP Methods

The following http methods are supported:

-   get
-   post
-   put
-   delete
-   patch

### Response

Response is mandatory and needs to be set on any defined route.

-   **`willSucceed()`** - a request to a route that was defined with willSucceed will return 200 as the status code and `{}` as the response body.

-   **`willFail(errorStatusCode?: number)`** - a request to route that was defined with willFail will return `errorStatusCode` as the status code (or default to 500 if none provided) and `{}` as the response body.

-   **`willReturn(response: any, statusCode?: number)`** - a request to route that was defined with willReturn will return status code `statusCode` (default is 200 if none provided) and `response` as the response body.

### Route Restrictions

Restrictions are optional and can be defined after calling `FakeHttpServer.{method}(path)`. Only **one** restriction can be set per route definition.  
Chaining more than one restriction will result in an error.

-   **`withBody(body: object)`**  
    Will match only requests with content-type header set to 'application/json' and body that is an objects that **deeply equal** the given body:

```js
const withBodyRoute = fakeServer.post('/some/path').withBody({a: 1, b: 2}).willSucceed();

// Request to /some/path with body { a: 1, b: 2 } => Success, 200 status code.
// Request to /some/path with body { a: 1, b: 2, c: 3 } => Fail, 400 status code.
```

-   **`withBodyThatMatches(regex: string)`**  
    Will match only requests with body that match the given **regex**.  
    i.e. route defined with `withBodyThatMatches('[a-zA-Z]+$')` will accept request body `abc` but will reject `123`.

-   **`withBodyThatContains(partialObject: object)`**  
    Will match only requests with content-type header set to 'application/json' and body that is a _superset_ of the given body.
    i.e. route defined with `withBodyThatContains({ a: 1, b: 2 })` will accept request body `{ a: 1, b: 2, c: 3}` but will reject a request with `{ a: 1 }` as the body.

-   **`withQueryParams(queryParams: object)`**  
    Will only match requests that match the query params set on `queryParams`.  

    i.e. route defined with `withQueryParams({ someQuery: true })` will match requests to `some/path?someQuery=true` but will reject `some/path?someQuery=false` or `some/path?someQuery=true&other=something`.
<br/><br/>
NOTES:


-   A request that failed to fulfill a restriction will return 400 and will result in false when asserting with `didReceive` (more on this on the next section).
-   When setting 2 or more routes with the same path, but with different body restrictions, it's enough to fulfill just 1 of the restrictions to get a match.

## Assertions

Each route exposes a `RouteCallTester` object that can be accessed using `route.call`:

```js
const route = fakeServer.get('/some/path').willSucceed();

const routeCallTester = route.call;
```

### Assertion Methods

FakeServer instance exposes 3 methods that can be helpful for your tests assertions.

-   **`didReceive(routeCallTester: RouteCallTester)`**  
    Returns true/false, based on whether this route was called since the server was started.  
    Usage example:

```js
const route = fakeServer.get('/your/api').willSucceed();

console.log(fakeServer.hasMade(route.call)); // false
await fetch('http://localhost:1234/your/api', {method: 'GET'});
console.log(fakeServer.hasMade(route.call)); // true
```

-   **`callsReceived(routeCallTester: RouteCallTester)`**  
    Returns an array of all calls received that match the provided route.  
    Each entry of the array is an object containing `method`, `path`, `headers` and `body`.

-   **`clearCallHistory()`**  
    After calling clearCallHistory hasMade will always return false and callsMade will always return an empty array until the next call is made.


### Assertion Constrains

It's possible to add a constrain to the routeCallTester. It's useful when the route was defined with a regex or a body restriction and you want to make sure _exactly_ what was the route called with.

-   **`withPath(specificPath: string)`**  
    Useful when defining a route with regex and you'd like to assert a specific path was called.  
    Usage example:

```js
await fetch('/some/path/xyz', {method: 'GET'});

console.log(fakeServer.didReceive(route.call.withPath('/some/path/xyz'))); // true
console.log(fakeServer.didReceive(route.call.withPath('/some/path/abc'))); // false
```

-   **`withBodyText(text: string)`**  

    Useful when defining a route with `withBodyThatMatches` using regex and you'd like to assert a specific body text.

-   **`withSpecificBody(body: object)`**  
    Useful when defining a route with `withBodyThatContains` and you'd like to assert a specific body object.

## More Usage Examples

You can check out our tests section to see a bunch of different usage examples.

-   [General Route Matching](./__tests__/route-matching-general-tests.ts)
-   [Body Restrictions on Route Definition](./__tests__/body-restrictions-on-route-definition-tests.ts)
-   [Assertions Constrains](./__tests__/body-restrictions-on-assertion-tests.ts)
-   [Mocking Response Elements](./__tests__/mocking-response-elements.ts)
