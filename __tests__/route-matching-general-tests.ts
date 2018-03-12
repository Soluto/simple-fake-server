import fetch from 'node-fetch';
import {FakeServer} from '../src';
import FakeHttpCalls from '../src/FakeHttpCalls';

const port = 4444;
let fakeServer;
let http: FakeHttpCalls;

beforeEach(() => {
    fakeServer = new FakeServer(port);
    fakeServer.start();
});

afterEach(() => {
    fakeServer.stop();
});

test('GET route defined and called - match', async () => {
    const path = '/somePath';
    const route = fakeServer.http
        .get()
        .to(path)
        .willSucceed();

    await fetch(`http://localhost:${port}${path}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call)).toEqual(true);
});

test('GET route with query params - match', async () => {
    const path = '/someQueryPath';
    const queryObject = {k1: 'v1', k2: 'v2'};
    const route = fakeServer.http
        .get()
        .to(path)
        .withQueryParams(queryObject)
        .willSucceed();

    const queryParams = '?k1=v1&k2=v2';

    await fetch(`http://localhost:${port}${path}${queryParams}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call)).toEqual(true);
});

test('GET route with wrong query params - no match', async () => {
    const path = '/someQueryPath';
    const queryObject = {k1: 'v1', k2: 'v2'};
    const route = fakeServer.http
        .get()
        .to(path)
        .withQueryParams(queryObject)
        .willSucceed();

    const wrongQueryParams = '?k1=v1&k3=v3';

    await fetch(`http://localhost:${port}${path}${wrongQueryParams}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call)).toEqual(false);
});

test('GET route with no query params and with query restrictions - no match', async () => {
    const path = '/someQueryPath';
    const queryObject = {k1: 'v1', k2: 'v2'};
    const route = fakeServer.http
        .get()
        .to(path)
        .withQueryParams(queryObject)
        .willSucceed();

    await fetch(`http://localhost:${port}${path}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call)).toEqual(false);
});

test('GET route with query paraysm without specifying query restrictions -  match', async () => {
    const path = '/someQueryPath';
    const route = fakeServer.http
        .get()
        .to(path)
        .willSucceed();

    const queryParams = '?k1=v1&k3=v3';

    await fetch(`http://localhost:${port}${path}${queryParams}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call)).toEqual(true);
});

test('DELETE route defined and called - match', async () => {
    const path = '/somePath';
    const route = fakeServer.http
        .delete()
        .to(path)
        .willSucceed();

    await fetch(`http://localhost:${port}${path}`, {method: 'DELETE'});

    expect(fakeServer.hasMade(route.call)).toEqual(true);
});

test('route defined and not called - no match', () => {
    const path = '/somePath';
    const route = fakeServer.http
        .get()
        .to(path)
        .willSucceed();

    expect(fakeServer.hasMade(route.call)).toEqual(false);
});

test('route defined with path regex - asserting on specific path that matches the regex - assertion success', async () => {
    const pathRegex = '/[a-zA-Z]+$';
    const actualPath = '/somePathThatMatchesTheRegex';
    const route = fakeServer.http
        .get()
        .to(pathRegex)
        .willSucceed();

    await fetch(`http://localhost:${port}${actualPath}`, {method: 'GET'});

    expect(fakeServer.hasMade(route.call.withPath(actualPath))).toEqual(true);
});

test('route defined with path regex - asserting on specific path that does not match the path regex - throws', () => {
    const pathRegex = '/[0-9]+$';
    const pathThatDoesNotMatchTheRegex = '/pathThatDoesNotMatchTheRegex';
    const route = fakeServer.http
        .get()
        .to(pathRegex)
        .willSucceed();

    expect(() => route.call.withPath(pathThatDoesNotMatchTheRegex)).toThrow();
});

test('route defined with path and body regex - chaining assertions, specific path and body match path and body regexes - assertion success', async () => {
    const pathRegex = '/[a-zA-Z]+$';
    const actualPath = '/somePath';
    const bodyRegex = '[0-9]+$';
    const actualBody = '123';
    const route = fakeServer.http
        .post()
        .to(pathRegex)
        .withBodyThatMatches(bodyRegex)
        .willSucceed();

    await fetch(`http://localhost:${port}${actualPath}`, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain'},
        body: actualBody,
    });

    expect(fakeServer.hasMade(route.call.withPath(actualPath).withBodyText(actualBody))).toEqual(true);
    expect(fakeServer.hasMade(route.call.withBodyText(actualBody).withPath(actualPath))).toEqual(true);
});
