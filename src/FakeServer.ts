import {Server} from 'http';
import * as https from 'https';
import * as queryString from 'query-string';
//@ts-ignore
import * as koa from 'koa';
//@ts-ignore
import * as cors from 'koa-cors';
//@ts-ignore
import * as koaBody from 'koa-bodyparser';
//@ts-ignore
import * as deepEquals from 'deep-equal';
//@ts-ignore
import * as isSubset from 'is-subset';
import * as selfSignedCertificate from './selfSignedCertificate';
import CallHistory, {Call} from './CallHistory';
import {BodyRestriction} from './models/BodyRestriction';
import FakeHttpCalls from './FakeHttpCalls';

export type MockedCall = {
    method: string;
    pathRegex: string;
    bodyRestriction?: BodyRestriction;
    queryParamsObject?: {};
    statusCode?: number;
    response?: any;
    responseHeaders?: Record<string, string>;
};

export default class FakeServer {
    public http: FakeHttpCalls;
    private callHistory: CallHistory;
    private mockedCalls: MockedCall[];
    private port: number;
    private tls: boolean;
    private server: Server | https.Server;
    private logger: (message: string) => void;

    constructor(port: number, tls = false, logger: (message: string) => void = () => {}) {
        if (!port) {
            throw new TypeError('No port provided!');
        }

        this.callHistory = new CallHistory();
        this.mockedCalls = [];
        this.port = port;
        this.tls = tls;
        this.http = new FakeHttpCalls(this);
        this.logger = logger;
    }

    public start() {
        if (this.server) {
            return;
        }

        const self = this;
        const app = koa();

        app.use(function* (next: any): Iterator<void> {
            this.header['content-type'] =
                this.headers['content-type'] &&
                this.headers['content-type'].replace(';charset=UTF-8', '').replace(';charset=utf-8', '');

            yield next;
        });
        app.use(koaBody({enableTypes: ['json', 'form', 'text']}));
        app.use(cors());
        app.use(function* (): Iterator<void> {
            const serverCall: Call = {
                method: this.req.method,
                path: this.url,
                headers: this.request.header,
                body: this.request.body,
            };

            const matched = self.mockedCalls.filter((mockedCall) => self.match(mockedCall)(serverCall));

            if (matched.length >= 1) {
                self.callHistory.push({
                    method: this.req.method,
                    path: this.url,
                    headers: this.request.header,
                    body: this.request.body,
                });
                const firstMatch = matched[matched.length - 1];
                self.logger(
                    `FakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(
                        this.request.body
                    )}]. Respond with status: [${firstMatch.statusCode}], body: [${JSON.stringify(
                        firstMatch.response
                    )}]${
                        firstMatch.responseHeaders ? ` and headers [${JSON.stringify(firstMatch.responseHeaders)}]` : ''
                    }`
                );

                this.status = firstMatch.statusCode;
                this.body = firstMatch.response;

                if (firstMatch.responseHeaders) {
                    const headers = firstMatch.responseHeaders;
                    Object.keys(headers).forEach((key) => this.response.set(key, headers[key]));
                }
            } else {
                self.logger(
                    `fakeServer:: no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`
                );
                this.status = 400;
                this.body = `no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`;
            }
        });

        this.clearCallHistory();

        this.server = !this.tls
            ? app.listen(this.port)
            : https.createServer(selfSignedCertificate, app.callback()).listen(this.port);
    }

    public stop() {
        this.server.close();
        delete this.server;
        this.mockedCalls = [];
    }

    public clearCallHistory() {
        this.callHistory.clear();
    }

    set(
        method: string,
        pathRegex: string,
        bodyRestriction: BodyRestriction,
        queryParamsObject?: {},
        response?: any,
        statusCode?: number,
        responseHeaders?: Record<string, string>
    ) {
        this.logger(
            `FakeServer:: registering [${method} ${pathRegex}, body restriction: ${JSON.stringify(
                bodyRestriction
            )}] with status [${statusCode}] and response [${JSON.stringify(response)}]`
        );
        this.mockedCalls.push({
            method,
            pathRegex,
            bodyRestriction,
            queryParamsObject,
            response,
            statusCode,
            responseHeaders,
        });
    }

    public hasMade(call: MockedCall) {
        return this.callHistory.get().some(this.match(call));
    }

    public callsMade(call: MockedCall) {
        return this.callHistory.get().filter(this.match(call));
    }

    private match(mockedCall: MockedCall) {
        return (serverCall: Call) => {
            const contentTypeIsApplicationJson = serverCall.headers['content-type'] === 'application/json';
            const callBodyAsString = contentTypeIsApplicationJson ? JSON.stringify(serverCall.body) : serverCall.body;
            const {bodyRestriction, queryParamsObject, pathRegex, method} = mockedCall;
            this.logger(
                `FakeServer: matching server call with predefined mocked call.
                 serverCall=${JSON.stringify(serverCall)},
                 mockedCall=${JSON.stringify(mockedCall)}`
            );

            if (serverCall.method !== method) {
                this.logger('FakeServer: call was not matched by method');
                return false;
            }

            if (!new RegExp(pathRegex).test(serverCall.path)) {
                this.logger('FakeServer: call was not matched by regex');
                return false;
            }

            if (queryParamsObject) {
                const splitUrl = serverCall.path.split('?');

                if (splitUrl.length < 2) {
                    return false;
                }
                const queryParamsOnUrl = queryString.parse(splitUrl[1]);

                if (!deepEquals(queryParamsOnUrl, mockedCall.queryParamsObject)) {
                    this.logger('FakeServer: call was not matched by query params');
                    return false;
                }
            }

            if (contentTypeIsApplicationJson && !bodyRestriction) {
                return false;
            }

            if (bodyRestriction?.exactText) {
                if (callBodyAsString !== bodyRestriction.exactText) {
                    this.logger('FakeServer: call body was not matched by exactText');
                    return false;
                }
            }

            if (bodyRestriction?.regex) {
                if (!new RegExp(bodyRestriction.regex).test(callBodyAsString)) {
                    this.logger('FakeServer: call body was not matched by regex');
                    return false;
                }
            }

            if (bodyRestriction?.object) {
                if (!deepEquals(serverCall.body, bodyRestriction.object)) {
                    this.logger('FakeServer: call body was not matched by exactObject');
                    return false;
                }
            }

            if (bodyRestriction?.minimalObject) {
                if (!isSubset(serverCall.body, bodyRestriction.minimalObject)) {
                    this.logger('FakeServer: call body was not matched by minimalObject');
                    return false;
                }
            }

            return true;
        };
    }
}
