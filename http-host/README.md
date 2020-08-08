# simple-fake-server-host
This is a small server to host a [simple-fake-server](https://github.com/Soluto/simple-fake-server).

## API

### Create mocks
`POST` `/fake_server_admin/calls`

### Get calls
`GET` `/fake_server_admin/calls`
### Clear mocks
`POST` `/fake_server_admin/clear`

## Example
`docker-compose` for the tests:
```yaml
  my-api:
    build: .
    environment:
      - OTHER_API_URL=http://fake-server:2000
    ports:
      - '3000:3000'
  fake-server:
    image: soluto/simple-fake-server:latest
    ports:
      - '3001:3000' # management port for tests
```

Tests:
```js
describe('test', () => {
    afterEach(() => axios.post('http://localhost:3001/fake_server_admin/clear'));

    it('test', async () => {
        const {data: {callId}} = await axios.post('http://localhost:3001/fake_server_admin/calls', {
            method: "get",
            url: 'api/v1/keys/foo',
            response: JSON.stringify("bar"),
            respondAsJson: true,
            statusCode: 200
        });

        await axios.post('http://localhost:3000/action');

        const {data: {hasBeenMade}} = await axios.get(`http://localhost:3001/fake_server_admin/calls?callId=${callId}`);

        expect(hasBeenMade).to.eq(true);
    });
});
```
or using our client:
```js
import Server from 'simple-fake-server-host-client';

const server = new Server({port: 3001});

describe('test', () => {
    afterEach(() => server.clear());

    it('test', async () => {
        const callId = await server.mock({
            url: 'api/v1/keys/foo',
            response: JSON.stringify("bar"),
            respondAsJson: true
        });

        await axios.post('http://localhost:3000/action');

        const {hasBeenMade} = await server.getCall(callId);

        expect(hasBeenMade).to.eq(true);
    });
});
```
## Env vars:  
`ADMIN_PORT` - Port for the admin calls (default 3000)  
`PORT` - Port for the fake calls (default 2000)  
