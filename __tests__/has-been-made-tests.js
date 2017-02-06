const fetch = require('node-fetch');

var app = require('../index');
const { fakeServer, httpFakeCalls } = app;

const port = 4444;

beforeEach(() => {
	fakeServer.start(port);
});

afterEach(() => {
	fakeServer.stop();
});

test('route defined and called - hasBeenMade() returns true', async () => {
	const path = '/somePath';
	const route = httpFakeCalls.get().to(path).willSucceed();

	await fetch(`http://localhost:${port}${path}`, { method: 'GET' });

	expect(route.call.hasBeenMade()).toEqual(true);
});

test('route defined and not called - hasBeenMade() returns false', async () => {
	const path = '/somePath';
	const route = httpFakeCalls.get().to(path).willSucceed();

	expect(route.call.hasBeenMade()).toEqual(false);
});

test('route defined with path regex - asserting on specific path that matches the regex - hasBeenMade() returns true', async () => {
	const pathRegex = '/[a-zA-Z]+$';
	const actualPath = '/somePathThatMatchesTheRegex';
	const route = httpFakeCalls.get().to(pathRegex).willSucceed();

	await fetch(`http://localhost:${port}${actualPath}`, { method: 'GET' });

	expect(route.call.withPath(actualPath).hasBeenMade()).toEqual(true);
});

test('route defined with path regex - asserting on specific path that does not match the path regex - throws', async () => {
	const pathRegex = '/[0-9]+$';
	const pathThatDoesNotMatchTheRegex = '/pathThatDoesNotMatchTheRegex';
	const route = httpFakeCalls.get().to(pathRegex).willSucceed();

	expect(() => route.call.withPath(pathThatDoesNotMatchTheRegex)).toThrow();
});

test('route defined with body regex - asserting on specific body that matches the regex - hasBeenMade() returns true', async () => {
	const bodyRegex = '{"message":"[a-zA-Z]+"}';
	const actualBody = JSON.stringify({ message: 'hi' });
	const path = '/somePath';
	const route = httpFakeCalls.post().to(path).withBodyThatMatches(bodyRegex).willSucceed();

	await fetch(`http://localhost:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: actualBody });

	expect(route.call.withBody(actualBody).hasBeenMade()).toEqual(true);
});

test('route defined with body regex - asserting on specific body that does not match the body regex - throws', async () => {
	const bodyRegex = '{"message":"[a-zA-Z]+"}';
	const bodyThatDoesNotMatchTheRegex = 'bodyThatDoesNotMatchTheRegex';
	const route = httpFakeCalls.get().to('/somePath').withBodyThatMatches(bodyRegex).willSucceed();

	expect(() => route.call.withBody(bodyThatDoesNotMatchTheRegex)).toThrow();
});

test('route defined with path and body regex - chaining assertions, specific path and body match path and body regexes - hasBeenMade() returns true', async () => {
	const pathRegex = '/[a-zA-Z]+$';
	const actualPath = '/somePath';
	const bodyRegex = '{"message":"[a-zA-Z]+"}';
	const actualBody = JSON.stringify({ message: 'hi' });
	const route = httpFakeCalls.post().to(pathRegex).withBodyThatMatches(bodyRegex).willSucceed();

	await fetch(`http://localhost:${port}${actualPath}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: actualBody });

	expect(route.call.withPath(actualPath).withBody(actualBody).hasBeenMade()).toEqual(true);
	expect(route.call.withBody(actualBody).withPath(actualPath).hasBeenMade()).toEqual(true);
});