import fetch from 'node-fetch';
import {FakeServer} from '../src';

const port = 4444;
let fakeServer: FakeServer;

beforeEach(() => {
    fakeServer = new FakeServer(port);
    fakeServer.start();
});

afterEach(() => {
    fakeServer.stop();
});

[
    {method: 'willSucceed', defaultStatus: 200, useNewApi: false},
    {method: 'willFail', defaultStatus: 500, useNewApi: false},
    {method: 'willSucceed', defaultStatus: 200, useNewApi: true},
    {method: 'willFail', defaultStatus: 500, useNewApi: true},
].forEach(({method, defaultStatus, useNewApi}) => {
    describe(`Route Matching - ${method}`, () => {
        test('GET route defined, one call matches and two dont, callsReceived returns only the matching call', async () => {
            const path = '/somePath';
            let route;
            if (useNewApi) {
                route = fakeServer.get(path)[method]();
            } else {
                route = fakeServer.get().to(path)[method]();
            }

            await fetch(`http://localhost:${port}${path}`, {method: 'GET'});
            await fetch(`http://localhost:${port}${path}`, {method: 'PUT'});
            await fetch(`http://localhost:${port}${path}`, {method: 'POST'});

            expect(fakeServer.callsReceived(route.call).length).toEqual(1);
        });

        test('GET route defined and called - match', async () => {
            const path = '/somePath';
            let route;
            if (useNewApi) {
                route = fakeServer.get(path)[method]();
            } else {
                route = fakeServer.get().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('GET route with query params - match', async () => {
            const path = '/someQueryPath';
            const queryObject = {k1: 'v1', k2: 'v2'};

            let route;
            if (useNewApi) {
                route = fakeServer.get(path).withQueryParams(queryObject)[method]();
            } else {
                route = fakeServer.get().to(path).withQueryParams(queryObject)[method]();
            }

            const queryParams = '?k1=v1&k2=v2';

            const res = await fetch(`http://localhost:${port}${path}${queryParams}`, {method: 'GET'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('GET route with extra query params - no match', async () => {
            const path = '/someQueryPath';
            const queryObject = {k1: 'v1'};
            let route;
            if (useNewApi) {
                route = fakeServer.get(path).withQueryParams(queryObject)[method]();
            } else {
                route = fakeServer.get().to(path).withQueryParams(queryObject)[method]();
            }

            const queryParams = '?k1=v1&k2=v2';

            const res = await fetch(`http://localhost:${port}${path}${queryParams}`, {method: 'GET'});

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('GET route with wrong query params - no match', async () => {
            const path = '/someQueryPath';
            const queryObject = {k1: 'v1', k2: 'v2'};
            let route;
            if (useNewApi) {
                route = fakeServer.get(path).withQueryParams(queryObject)[method]();
            } else {
                route = fakeServer.get().to(path).withQueryParams(queryObject)[method]();
            }

            const wrongQueryParams = '?k1=v1&k3=v3';

            const res = await fetch(`http://localhost:${port}${path}${wrongQueryParams}`, {method: 'GET'});

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('GET route with partial query params - no match', async () => {
            const path = '/someQueryPath';
            const queryObject = {k1: 'v1', k2: 'v2'};
            let route;
            if (useNewApi) {
                route = fakeServer.get(path).withQueryParams(queryObject)[method]();
            } else {
                route = fakeServer.get().to(path).withQueryParams(queryObject)[method]();
            }

            const wrongQueryParams = '?k1=v1';

            const res = await fetch(`http://localhost:${port}${path}${wrongQueryParams}`, {method: 'GET'});

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('GET route with no query params and with query restrictions - no match', async () => {
            const path = '/someQueryPath';
            const queryObject = {k1: 'v1', k2: 'v2'};
            let route;
            if (useNewApi) {
                route = fakeServer.get(path).withQueryParams(queryObject)[method]();
            } else {
                route = fakeServer.get().to(path).withQueryParams(queryObject)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});

            expect(res.status).toEqual(400);
            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('GET route with query paraysm without specifying query restrictions -  match', async () => {
            const path = '/someQueryPath';

            let route;
            if (useNewApi) {
                route = fakeServer.get()[method]();
            } else {
                route = fakeServer.get().to(path)[method]();
            }

            const queryParams = '?k1=v1&k3=v3';

            const res = await fetch(`http://localhost:${port}${path}${queryParams}`, {method: 'GET'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('DELETE route defined and called - match', async () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.delete(path)[method]();
            } else {
                route = fakeServer.delete().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'DELETE'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('PUT route defined and called - match', async () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.put(path)[method]();
            } else {
                route = fakeServer.put().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'PUT'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('PATCH route defined and called - match', async () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.patch(path)[method]();
            } else {
                route = fakeServer.patch().to(path)[method]();
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'PATCH'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('route defined and not called - no match', () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.get(path)[method]();
            } else {
                route = fakeServer.get().to(path)[method]();
            }

            expect(fakeServer.didReceive(route.call)).toEqual(false);
        });

        test('route defined with path regex - asserting on specific path that matches the regex - assertion success', async () => {
            const pathRegex = '/[a-zA-Z]+$';
            const actualPath = '/somePathThatMatchesTheRegex';

            let route;
            if (useNewApi) {
                route = fakeServer.get(pathRegex)[method]();
            } else {
                route = fakeServer.get().to(pathRegex)[method]();
            }

            const res = await fetch(`http://localhost:${port}${actualPath}`, {method: 'GET'});

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call.withPath(actualPath))).toEqual(true);
        });

        test('route defined with path regex - asserting on specific path that does not match the path regex - throws', () => {
            const pathRegex = '/[0-9]+$';
            const pathThatDoesNotMatchTheRegex = '/pathThatDoesNotMatchTheRegex';

            let route;
            if (useNewApi) {
                route = fakeServer.get(pathRegex)[method]();
            } else {
                route = fakeServer.get().to(pathRegex)[method]();
            }

            expect(() => route.call.withPath(pathThatDoesNotMatchTheRegex)).toThrow();
        });

        test('route defined with path and body regex - chaining assertions, specific path and body match path and body regex - assertion success', async () => {
            const pathRegex = '/[a-zA-Z]+$';
            const actualPath = '/somePath';
            const bodyRegex = '[0-9]+$';
            const actualBody = '123';

            let route;
            if (useNewApi) {
                route = fakeServer.post(pathRegex).withBodyThatMatches(bodyRegex)[method]();
            } else {
                route = fakeServer.post().to(pathRegex).withBodyThatMatches(bodyRegex)[method]();
            }

            const res = await fetch(`http://localhost:${port}${actualPath}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(res.status).toEqual(defaultStatus);
            expect(fakeServer.didReceive(route.call.withPath(actualPath).withBodyText(actualBody))).toEqual(true);
            expect(fakeServer.didReceive(route.call.withBodyText(actualBody).withPath(actualPath))).toEqual(true);
        });
    });
});

[{useNewApi: true}, {useNewApi: false}].forEach(({useNewApi}) => {
    describe('Route Matching - willReturn', () => {
        test('GET route defined with default status code and called - match', async () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.get(path).willReturn({name: 'Morty'});
            } else {
                route = fakeServer.get().to(path).willReturn({name: 'Morty'});
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});
            const body = await res.json();

            expect(body.name).toEqual('Morty');
            expect(res.status).toEqual(200);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('GET route defined with custom status code and called - match', async () => {
            const path = '/somePath';

            let route;
            if (useNewApi) {
                route = fakeServer.get(path).willReturn({name: 'Teapot'}, 418);
            } else {
                route = fakeServer.get().to(path).willReturn({name: 'Teapot'}, 418);
            }

            const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});
            const body = await res.json();

            expect(body.name).toEqual('Teapot');
            expect(res.status).toEqual(418);
            expect(fakeServer.didReceive(route.call)).toEqual(true);
        });

        test('route defined with path and body regex - chaining assertions, specific path and body match path and body regex - assertion success', async () => {
            const pathRegex = '/[a-zA-Z]+$';
            const actualPath = '/somePath';
            const bodyRegex = '[0-9]+$';
            const actualBody = '123';
            const requestBody = 'body as string';
            let route = fakeServer.post().to(pathRegex).withBodyThatMatches(bodyRegex).willReturn(requestBody, 300);

            if (useNewApi) {
                route = fakeServer.post(pathRegex).withBodyThatMatches(bodyRegex).willReturn(requestBody, 300);
            } else {
                route = fakeServer.post().to(pathRegex).withBodyThatMatches(bodyRegex).willReturn(requestBody, 300);
            }

            const res = await fetch(`http://localhost:${port}${actualPath}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });
            const body = await res.text();

            expect(res.status).toEqual(300);
            expect(body).toEqual(requestBody);
            expect(fakeServer.didReceive(route.call.withPath(actualPath).withBodyText(actualBody))).toEqual(true);
            expect(fakeServer.didReceive(route.call.withBodyText(actualBody).withPath(actualPath))).toEqual(true);
        });
    });
});
