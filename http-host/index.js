const express = require('express');
const bodyParser = require('body-parser');
const { FakeServer } = require('simple-fake-server');
const stream = require('stream');
const intoStream = require('into-stream');
const uuid = require('uuid/v4');

const app = express();

const serverPort = process.env.PORT || 2000;
const adminPort = process.env.ADMIN_PORT || 3000;

const fakeServer = new FakeServer(serverPort, false, console.log);
fakeServer.start();

let mockedCalls = {};

app.use(bodyParser.json());

app.post('/fake_server_admin/calls', ({ body: { method: mockedMethod, url: mockedUrl, body: mockedReqBody, query, response: mockedResponse, respondAsJson, statusCode, respondAsStream, responseHeaders, allowSupersetOfBody } }, res) => {
  console.log(`Simple-Fake-Server got mock call to ${mockedMethod} ${mockedUrl} \n mocked Body : ${mockedReqBody}, mockedStatus: ${statusCode}, mockedResponseHeaders: ${responseHeaders}`);
  const callId = uuid();
  let call;
  let mock;

  if (mockedReqBody) {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl);
    if (allowSupersetOfBody) {
      mock.withBodyThatContains(JSON.parse(mockedReqBody));
    }
    else {
      mock.withBody(JSON.parse(mockedReqBody));
    }

  } else if (query) {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl)
      .withQueryParams(JSON.parse(query));
  } else {
    mock = fakeServer.http[mockedMethod]()
      .to(mockedUrl);
  }
  if (statusCode && statusCode >= 400) {
    call = mock
      .willFail(statusCode);
  } else {
    let finalResponse = mockedResponse;
    if (finalResponse) {
      finalResponse = respondAsJson ? JSON.parse(finalResponse) : finalResponse;
      finalResponse = respondAsStream ? intoStream(finalResponse) : finalResponse;
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
