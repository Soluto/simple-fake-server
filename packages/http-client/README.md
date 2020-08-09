# simple-fake-server-host-client
This is a the client library to use with `simple-fake-server-host`.

## Example
```typescript
import Server from 'simple-fake-server-host-client';

const server = new Server();

// register a mock
const callId = await server.mock({url: '/isAlive', response: true});

// get all calls
const calls = await server.getCalls();

// get a specific call
const {hasBeenMade} = await server.getCall(callId);

// clear all mocks
await sever.clear();
```

## Seriously? simple-fake-server-host-client?
Yes, seriously