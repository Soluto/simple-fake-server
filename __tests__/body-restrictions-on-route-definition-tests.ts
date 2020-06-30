import fetch from 'node-fetch';
import {FakeServer} from '../src';

const port = 5555;
const path = '/somePath';
const lettersRegex = '[a-zA-Z]+$';
let fakeServer: FakeServer;

beforeEach(() => {
    fakeServer = new FakeServer(port);
    fakeServer.start();
});

afterEach(() => {
    fakeServer.stop();
});

// route defined with regex body restriction

[
    {method: 'willSucceed', defaultStatus: 200},
    {method: 'willFail', defaultStatus: 500},
    {method: 'willSucceed', defaultStatus: 200, useNewApi: true},
    {method: 'willFail', defaultStatus: 500, useNewApi: true},
].forEach(({method, defaultStatus, useNewApi}) => {
    describe(`Body Restriction on routes - ${method}`, () => {
        test('regex restriction, request body matches regex - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex)[method]();
            }

            const actualBody = 'abc';

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);

            const callsMade = fakeServer.callsMade(route.call);
            expect(callsMade[0].path).toEqual(path);
            expect(callsMade[0].body).toEqual(actualBody);
        });

        test('regex restriction, request has "application/json", request body matches regex - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches('{.*}')[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches('{.*}')[method]();
            }

            const actualBody = JSON.stringify({message: 'hi'});

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: actualBody,
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('route defined with regex body restriction, request body does not match regex - no match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex)[method]();
            }

            const actualBody = '123';

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('route defined with regex body restriction, request has "application/json", request body does not match regex - no match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex)[method]();
            }

            const actualBody = '123';

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: actualBody,
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        // route defined with partial object body restriction

        test('partial object restriction, request has "application/json", request body is equal to the body route object - match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('partial object restriction, request has "application/json", request body is equal to the body route object but with different property order - match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {b: 2, a: 1};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('partial object restriction, request has "application/json", request body is a superset of the body route object - match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2, c: 3};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('partial object restriction, request has "application/json", request body is not a superset of the body route object - no match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {x: 1, y: 2};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('partial object restriction, request has "application/json", request body is not a superset of the body route object (missing property) - no match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {a: 1};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('partial object restriction, request has "application/json", request body is not a superset of the body route object (different value) - no match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 1};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('partial object restriction, request has "application/json", request body cannot be parsed to an object - no match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = 'abc';
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                actualBody,
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('partial object restriction, request does not have "application/json" - no match', async () => {
            const expectedPartialBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        // route defined with object body restriction

        test('object restriction, request has "application/json", request body is equal to the body route object - match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2};

            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('object restriction, request has "application/json", request body is equal to the body route object but with different property order - match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {b: 2, a: 1};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('object restriction, request has "application/json", request body is a superset of the body route object - no match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2, c: 3};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('object restriction, request has "application/json", request body is a subset of the body route object - no match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {a: 1};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('object restriction, request has "application/json", request body is different than the body route object - no match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 1};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('object restriction, request has "application/json", request body cannot be parsed to an object - no match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = 'abc';
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                actualBody,
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('object restriction, request does not have "application/json" - no match', async () => {
            const expectedBody = {a: 1, b: 2};
            const actualBody = {a: 1, b: 2};
            let route;
            if (useNewApi) {
                route = fakeServer.post(path).withBody(expectedBody)[method]();
            } else {
                route = fakeServer.post().to(path).withBody(expectedBody)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: JSON.stringify(actualBody),
            });

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        // route defined with no body restriction

        test('no body restriction, request body empty - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path)[method]();
            } else {
                route = fakeServer.post().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'POST'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('no body restriction, request has "application/json", request body empty - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path)[method]();
            } else {
                route = fakeServer.post().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('no body restriction, request body not empty - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path)[method]();
            } else {
                route = fakeServer.post().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: 'some body',
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('no body restriction, request has "application/json", request body not empty - match', async () => {
            let route;
            if (useNewApi) {
                route = fakeServer.post(path)[method]();
            } else {
                route = fakeServer.post().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({some: 'body'}),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('defining 2 routes with the same path with restrictions, make a call that matches only one - success + match', async () => {
            let route1;
            let route2;
            if (useNewApi) {
                route1 = fakeServer.post(path).withBodyThatContains({c: 3, d: 4})[method]();
                route2 = fakeServer.post(path).withBodyThatContains({a: 1, b: 2})[method]();
            } else {
                route1 = fakeServer.post().to(path).withBodyThatContains({c: 3, d: 4})[method]();
                route2 = fakeServer.post().to(path).withBodyThatContains({a: 1, b: 2})[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({a: 1, b: 2}),
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route1.call)).toEqual(false);
            expect(fakeServer.didReceive(route2.call)).toEqual(true);
        });
    });
});
