import express from 'express';
import bodyParser from 'body-parser';
import {FakeServer, FakeRoute} from 'simple-fake-server';
import intoStream from 'into-stream';
import uuid from 'uuid';

const app = express();

const serverPort = Number(process.env.PORT || 2000);
const adminPort = Number(process.env.ADMIN_PORT || 3000);

const fakeServer = new FakeServer(serverPort, false, console.log);
fakeServer.start();

let mockedCalls: {
    [x: string]: FakeRoute;
} = {};

app.use(bodyParser.json({limit: '10mb'}));

interface CreateMockRequestBody {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    url: string;
    body: string;
    query: any; //TODO: Use a proper type
    response: any; //TODO: Use a proper type
    respondAsJson: boolean;
    statusCode: number;
    respondAsStream: boolean;
    respondAsBuffer: boolean;
    responseHeaders: any; //TODO: Use a proper type
    allowSupersetOfBody: boolean;
}

app.post<{}, {}, CreateMockRequestBody>(
    '/fake_server_admin/calls',
    (
        {
            body: {
                method: mockedMethod,
                url: mockedUrl,
                body: mockedReqBody,
                query,
                response: mockedResponse,
                respondAsJson,
                statusCode,
                respondAsStream,
                respondAsBuffer,
                responseHeaders,
                allowSupersetOfBody,
            },
        },
        res
    ) => {
        console.log(
            `simple-fake-server got mock call to ${mockedMethod} ${mockedUrl} \n mocked Body : ${mockedReqBody}, mockedStatus: ${statusCode}, mockedResponseHeaders: ${responseHeaders}`
        );
        const callId = uuid.v4();
        let call;
        let mock;

        if (mockedReqBody) {
            mock = fakeServer[mockedMethod](mockedUrl);
            if (allowSupersetOfBody) {
                mock = mock.withBodyThatContains(JSON.parse(mockedReqBody));
            } else {
                mock = mock.withBody(JSON.parse(mockedReqBody));
            }
        } else if (query) {
            mock = fakeServer[mockedMethod](mockedUrl).withQueryParams(JSON.parse(query));
        } else {
            mock = fakeServer[mockedMethod](mockedUrl);
        }
        if (statusCode && statusCode >= 400) {
            call = mock.willFail(statusCode);
        } else {
            let finalResponse = mockedResponse;
            if (finalResponse) {
                finalResponse = respondAsJson ? JSON.parse(finalResponse) : finalResponse;
                finalResponse = respondAsStream ? intoStream(finalResponse) : finalResponse;
                finalResponse = respondAsBuffer ? Buffer.from(finalResponse.data) : finalResponse;
            }
            call = mock.willReturn(finalResponse, statusCode, responseHeaders);
        }

        mockedCalls[callId] = call;
        res.send({callId});
    }
);

app.post('/fake_server_admin/clear', (_req, res) => {
    console.log('Got a request to clear all mocks');
    fakeServer.stop();
    fakeServer.start();
    res.send('Ok');
});

interface GetCallQueryParams {
    callId: string;
    [x: string]: string;
}

app.get<{}, {}, {}, GetCallQueryParams>('/fake_server_admin/calls', (req, res) => {
    if (!req.query.callId) {
        res.send(fakeServer.callHistory);
        return;
    }

    const mockedCall = mockedCalls[req.query.callId] || {call: {}};
    const madeCalls = fakeServer.callHistory.calls.filter(
        (c) => c.method === mockedCall.call.method && new RegExp(mockedCall.call.pathRegex).test(c.path)
    );

    if (!mockedCall || !madeCalls.length) {
        res.send({hasBeenMade: false});
        return;
    }

    res.send({hasBeenMade: true, madeCalls});
});

app.listen(adminPort, () =>
    console.log(`simple fake server admin is on port ${adminPort}, mocked api is on port ${serverPort}`)
);
