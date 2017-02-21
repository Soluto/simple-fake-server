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

test('route defined and called - match', async () => {
	const path = '/somePath';
	const route = httpFakeCalls.get().to(path).willSucceed();

	await fetch(`http://localhost:${port}${path}`, { method: 'GET' });

	expect(route.call.hasBeenMade()).toEqual(true);
});

test('route defined and not called - no match', async () => {
	const path = '/somePath';
	const route = httpFakeCalls.get().to(path).willSucceed();

	expect(route.call.hasBeenMade()).toEqual(false);
});

test('route defined with path regex - asserting on specific path that matches the regex - assertion success', async () => {
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

test('route defined with path and body regex - chaining assertions, specific path and body match path and body regexes - assertion success', async () => {
	const pathRegex = '/[a-zA-Z]+$';
	const actualPath = '/somePath';
	const bodyRegex = '[0-9]+$';
	const actualBody = '123';
	const route = httpFakeCalls.post().to(pathRegex).withBodyThatMatches(bodyRegex).willSucceed();

	await fetch(`http://localhost:${port}${actualPath}`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: actualBody });

	expect(route.call.withPath(actualPath).withBodyText(actualBody).hasBeenMade()).toEqual(true);
	expect(route.call.withBodyText(actualBody).withPath(actualPath).hasBeenMade()).toEqual(true);
});