import {Server} from 'http';
import https, {Server as SecureServer} from 'https';
import queryString from 'query-string';
//@ts-ignore
import koa from 'koa';
//@ts-ignore
import cors from 'koa-cors';
//@ts-ignore
import koaBody from 'koa-body';
import deepEquals from 'deep-equal';
//@ts-ignore
import isSubset from 'is-subset';
import * as selfSignedCertificate from './selfSignedCertificate';
import CallHistory from './CallHistory';
import {BodyRestriction} from './models/BodyRestriction';
import FakeHttpCalls from './FakeHttpCalls';

export type MockedCall = {
    method: string;
    pathRegex: string;
    bodyRestriction?: BodyRestriction;
    queryParamsObject?: {};
    errorStatus?: number;
    isError?: boolean;
    response?: any;
};

const log = (message: string) => {
    if (!process.env.DEBUG) {
        return;
    }

    console.log(message);
};

export default class FakeServer {
    public http: FakeHttpCalls;

    callHistory: CallHistory;
    mockedCalls: MockedCall[];
    port: number;
    tls: boolean;
    server: Server | SecureServer;

    constructor(port: number, tls = false) {
        if (!port) {
            throw new TypeError('No port provided!');
        }

        this.callHistory = new CallHistory();
        this.mockedCalls = [];
        this.port = port;
        this.tls = tls;
        this.http = new FakeHttpCalls(this);
    }

    start() {
        if (this.server) {
            return;
        }

        const self = this;
        const app = koa();

        app.use(koaBody());
        app.use(cors());
        app.use(function*(): Iterator<void> {
            const matched = self.mockedCalls.filter(
                ({method, pathRegex, queryParamsObject, bodyRestriction = {}}: MockedCall) => {
                    if (method !== this.req.method) {
                        return false;
                    }

                    if (!new RegExp(pathRegex).test(this.url)) {
                        return false;
                    }

                    const contentTypeIsApplicationJson = this.request.header['content-type'] === 'application/json';

                    if (queryParamsObject) {
                        const splitUrl = this.url.split('?');

                        if (splitUrl.length < 2) {
                            return false;
                        }
                        const queryParamsOnUrl = queryString.parse(splitUrl[1]);

                        if (!deepEquals(queryParamsOnUrl, queryParamsObject)) {
                            return false;
                        }
                    }
                    if (bodyRestriction.regex) {
                        const requestBodyAsString = contentTypeIsApplicationJson
                            ? JSON.stringify(this.request.body)
                            : this.request.body;

                        if (!new RegExp(bodyRestriction.regex).test(requestBodyAsString)) {
                            return false;
                        }
                    }
                    if (
                        bodyRestriction.minimalObject &&
                        (!contentTypeIsApplicationJson || !isSubset(this.request.body, bodyRestriction.minimalObject))
                    ) {
                        return false;
                    }

                    if (
                        bodyRestriction.object &&
                        (!contentTypeIsApplicationJson || !deepEquals(this.request.body, bodyRestriction.object))
                    ) {
                        return false;
                    }

                    return true;
                }
            );

            if (matched.length >= 1) {
                self.callHistory.push({
                    method: this.req.method,
                    path: this.url,
                    headers: this.request.header,
                    body: this.request.body,
                });
                const firstMatch = matched[matched.length - 1];

                if (firstMatch.isError) {
                    log(
                        `fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(
                            this.request.body
                        )}]. Respond with error: [${firstMatch.errorStatus}]`
                    );
                    this.status = firstMatch.errorStatus;
                } else {
                    log(
                        `fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(
                            this.request.body
                        )}]. Respond with: [${JSON.stringify(firstMatch.response)}]`
                    );
                    this.body = firstMatch.response;
                }
            } else {
                log(`fakeServer:: no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`);
                this.status = 400;
                this.body = `no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`;
            }
        });

        this.clearCallHistory();

        this.server = !this.tls
            ? app.listen(this.port)
            : https.createServer(selfSignedCertificate, app.callback()).listen(this.port);
    }

    stop() {
        this.server.close();
        delete this.server;
        this.mockedCalls = [];
    }

    clearCallHistory() {
        this.callHistory.clear();
    }

    set(method: string, pathRegex: string, bodyRestriction: BodyRestriction, queryParamsObject: {}, response: any) {
        log(
            `fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(
                bodyRestriction
            )}] with response [${JSON.stringify(response)}]`
        );
        this.mockedCalls.push({method, pathRegex, bodyRestriction, queryParamsObject, response});
    }

    setError(
        method: string,
        pathRegex: string,
        bodyRestriction: BodyRestriction,
        queryParamsObject: {},
        errorStatus: number
    ) {
        log(
            `fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(
                bodyRestriction
            )}] with error code [${errorStatus}]`
        );
        this.mockedCalls.push({method, pathRegex, bodyRestriction, queryParamsObject, errorStatus, isError: true});
    }

    hasMade(call: MockedCall) {
        return this.callHistory.get().some(serverCall => {
            if (serverCall.method !== call.method) {
                return false;
            }

            if (!new RegExp(call.pathRegex).test(serverCall.path)) {
                return false;
            }

            const contentTypeIsApplicationJson = serverCall.headers['content-type'] === 'application/json';
            const callBodyAsString = contentTypeIsApplicationJson ? JSON.stringify(serverCall.body) : serverCall.body;

            if (call.bodyRestriction) {
                if (call.bodyRestriction.exactText) {
                    if (callBodyAsString !== call.bodyRestriction.exactText) {
                        return false;
                    }
                } else if (call.bodyRestriction.regex) {
                    if (!new RegExp(call.bodyRestriction.regex).test(callBodyAsString)) {
                        return false;
                    }
                }

                if (call.bodyRestriction.exactObject) {
                    if (!deepEquals(serverCall.body, call.bodyRestriction.exactObject)) {
                        return false;
                    }
                } else if (call.bodyRestriction.minimalObject) {
                    if (!isSubset(serverCall.body, call.bodyRestriction.minimalObject)) {
                        return false;
                    }
                }
            }

            return true;
        });
    }
}
