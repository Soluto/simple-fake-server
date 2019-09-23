const express = require('express');
const bodyParser = require('body-parser');
const { FakeServer } = require('simple-fake-server');
const stream = require('stream');
const uuid = require('uuid/v4');

const app = express();

const serverPort = process.env.PORT || 2000;
const adminPort = process.env.ADMIN_PORT || 3000;

const fakeServer = new FakeServer(serverPort, false, console.log);
fakeServer.start();

let mockedCalls = {};

app.use(bodyParser.json());

app.post('/fake_server_admin/calls', ({ body: { method: mockedMethod, url: mockedUrl, body: mockedReqBody, query, response: mockedResponse, isJson, statusCode, respondAsStream, responseHeaders } }, res) => {
  console.log(`Simple-Fake-Server got mock call to ${mockedMethod} ${mockedUrl} \n mocked Body : ${mockedReqBody}, mockedStatus: ${statusCode}, mockedResponseHeaders: ${responseHeaders}`);
  const callId = uuid();
  let call;
  let mock;

  if (mockedReqBody) {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl)
      .withBody(JSON.parse(mockedReqBody));
  } else if (query) {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl)
      .withQueryParams(JSON.parse(query));
  } else {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl);
  }
  if (statusCode && statusCode !== 200 && statusCode !== 201) {
    call = mock
      .willFail(statusCode);
  } else {
    let finalResponse = mockedResponse;
    if (finalResponse) {
      finalResponse = isJson ? JSON.parse(finalResponse) : finalResponse;
      if (respondAsStream) {
        const streamResponse = new stream.Readable();
        streamResponse._read = () => {};
        streamResponse.push(String(finalResponse));
        streamResponse.push(null);
        finalResponse = streamResponse;
      }
    }
    call = mock
      .willReturn(finalResponse, statusCode, responseHeaders);
  }

  mockedCalls[callId] = call;
  res.send({ callId });
});

app.post('/fake_server_admin/clear', (req, res) => {
  console.log('Got a request to clear all mocks');
  fakeServer.stop();
  fakeServer.start();
  res.send('Ok');
});

app.get('/fake_server_admin/calls', ({ query: { callId } }, res) => {
  if (!callId) {
    res.send(fakeServer.callHistory);
    return;
  }

  const mockedCall = mockedCalls[callId] || { call: {} };
  const madeCalls = fakeServer.callHistory.calls.filter(
    c =>
      c.method === mockedCall.call.method &&
      new RegExp(mockedCall.call.pathRegex).test(c.path),
  );

  if (!mockedCall || !madeCalls.length) {
    res.send({ hasBeenMade: false });
    return;
  }

  res.send({ hasBeenMade: true, madeCalls });
});

app.listen(adminPort, () =>
  console.log(`simple fake server admin is on port ${adminPort}, mocked api is on port ${serverPort}`),
);
