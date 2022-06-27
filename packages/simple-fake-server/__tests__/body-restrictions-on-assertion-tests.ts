import fetch from 'node-fetch';
import {FakeServer} from '../src';
import {FakeRoute} from '../src/FakeHttpRequests';

const port = 6666;
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
[{useNewApi: true}, {useNewApi: false}].forEach(({useNewApi}) => {
    describe('Body restriction on assertion', () => {
        test('regex restriction, assert on a specific string that matches the regex, request body equals test string - assertion success', async () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex).willSucceed();
            }

            const actualBody = 'abc';
            const testString = 'abc';

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(fakeServer.didReceive(route.request.withBodyText(testString))).toEqual(true);
        });

        test('regex restriction, assert on a specific string that matches the regex, request body does not equal test string (but matches regex) - assertion success', async () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex).willSucceed();
            }
            const actualBody = 'abc';
            const testString = 'def';

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(fakeServer.didReceive(route.request.withBodyText(testString))).toEqual(false);
        });

        test('regex restriction, assert on a specific string that does not match the regex - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex).willSucceed();
            }

            expect(() => route.request.withBodyText('123')).toThrow();
        });

        test('regex restriction, passing something other than string to specific string method - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex).willSucceed();
            }

            expect(() => route.request.withBodyText({} as string)).toThrow();
        });

        test('regex restriction, assert on a specific object - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatMatches(lettersRegex).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatMatches(lettersRegex).willSucceed();
            }

            expect(() => route.request.withSpecificBody({})).toThrow();
        });

        // route defined with partial object body restriction

        test('partial object restriction, assert on a specific object that matches the partial object, request body equals test object - assertion success', async () => {
            const expectedPartialBody = {a: 1};
            const actualBody = {a: 1, b: 2};
            const testBody = {a: 1, b: 2};

            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody).willSucceed();
            }

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(fakeServer.didReceive(route.request.withSpecificBody(testBody))).toEqual(true);
        });

        test('partial object restriction, assert on a specific object that matches the partial object, request body does not equal test object (but matches partial object) - assertion fails', async () => {
            const expectedPartialBody = {a: 1};
            const actualBody = {a: 1, b: 2};
            const testBody = {a: 1};
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody).willSucceed();
            }

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(fakeServer.didReceive(route.request.withSpecificBody(testBody))).toEqual(false);
        });

        test('partial object restriction, assert on a specific object that does not match the partial object - exception', () => {
            const expectedPartialBody = {a: 1};
            const testBody = {b: 2};
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains(expectedPartialBody).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains(expectedPartialBody).willSucceed();
            }

            expect(() => route.request.withSpecificBody(testBody)).toThrow();
        });

        test('partial object restriction, passing something other than object to specific object method - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains({a: 1}).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains({a: 1}).willSucceed();
            }

            expect(() => route.request.withSpecificBody('')).toThrow();
        });

        test('partial object restriction, assert on a specific string - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBodyThatContains({}).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBodyThatContains({}).willSucceed();
            }

            expect(() => route.request.withBodyText('')).toThrow();
        });

        // route defined with object body restriction

        test('object restriction, assert on a specific string - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBody({}).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBody({}).willSucceed();
            }

            expect(() => route.request.withBodyText('')).toThrow();
        });

        test('object restriction, assert on a specific object (again) - exception', () => {
            let route: FakeRoute;
            if (useNewApi) {
                route = fakeServer.post(path).withBody({}).willSucceed();
            } else {
                route = fakeServer.post().to(path).withBody({}).willSucceed();
            }

            expect(() => route.request.withSpecificBody({})).toThrow();
        });

        // route defined with no body restriction

        test('no body restriction, assert on a specific string, application/json header, request body equals test string - assertion success', async () => {
            let route: FakeRoute;

            if (useNewApi) {
                route = fakeServer.post(path).willSucceed();
            } else {
                route = fakeServer.post().to(path).willSucceed();
            }

            const actualBody = {a: 1};
            const testString = JSON.stringify({a: 1});

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(fakeServer.didReceive(route.request.withBodyText(testString))).toEqual(true);
        });

        test('no body restriction, assert on a specific string, no application/json header, request body equals test string - assertion success', async () => {
            let route: FakeRoute;

            if (useNewApi) {
                route = fakeServer.post(path).willSucceed();
            } else {
                route = fakeServer.post().to(path).willSucceed();
            }

            const actualBody = 'abc';
            const testString = 'abc';

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: actualBody,
            });

            expect(fakeServer.didReceive(route.request.withBodyText(testString))).toEqual(true);
        });

        test('no body restriction, assert on a specific object, application/json header request body equals test object - assertion success', async () => {
            const actualBody = {a: 1, b: 2};
            const testBody = {a: 1, b: 2};
            let route: FakeRoute;

            if (useNewApi) {
                route = fakeServer.post(path).willSucceed();
            } else {
                route = fakeServer.post().to(path).willSucceed();
            }

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(actualBody),
            });

            expect(fakeServer.didReceive(route.request.withSpecificBody(testBody))).toEqual(true);
        });

        test('no body restriction, assert on a specific object, no application/json header, request body equals test object - assertion fails', async () => {
            const actualBody = {a: 1, b: 2};
            const testBody = {a: 1, b: 2};
            let route: FakeRoute;

            if (useNewApi) {
                route = fakeServer.post(path).willSucceed();
            } else {
                route = fakeServer.post().to(path).willSucceed();
            }

            await fetch(`http://localhost:${port}${path}`, {
                method: 'POST',
                headers: {'Content-Type': 'text/plain'},
                body: JSON.stringify(actualBody),
            });

            expect(fakeServer.didReceive(route.request.withSpecificBody(testBody))).toEqual(false);
        });
    });
});
