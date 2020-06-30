import fetch from 'node-fetch';
import getStream from 'get-stream';
import intoStream from 'into-stream';
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

describe('Route Matching - willReturn Response Elements', () => {
    test('GET route defined with mocked body and response headers', async () => {
        const path = '/somePath';
        const route = fakeServer.get().to(path).willReturn({name: 'Cloud'}, 200, {imontop: 'Of The World'});

        const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});
        const body = await res.json();

        expect(body.name).toEqual('Cloud');
        expect(res.status).toEqual(200);
        expect(res.headers.get('imontop')).toEqual('Of The World');
        expect(fakeServer.hasMade(route.call)).toEqual(true);
    });

    test('GET route defined with response as stream', async () => {
        const stringTobeStreamed = 'Rivers are huge Streams';
        const bodyAsStream = intoStream(stringTobeStreamed);
        const path = '/somePath';
        const route = fakeServer.get().to(path).willReturn(bodyAsStream);

        const res = await fetch(`http://localhost:${port}${path}`, {method: 'GET'});
        expect(res.headers.get('content-type')).toEqual('application/octet-stream');
        expect(res.status).toEqual(200);
        expect(fakeServer.hasMade(route.call)).toEqual(true);
        const body = await getStream(res.body);
        expect(body).toEqual(stringTobeStreamed);
    });
});
