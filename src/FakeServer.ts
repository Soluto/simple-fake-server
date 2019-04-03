import {Server} from 'http';
import * as https from 'https';
import * as queryString from 'query-string';
//@ts-ignore
import * as koa from 'koa';
//@ts-ignore
import * as cors from 'koa-cors';
//@ts-ignore
import * as koaBody from 'koa-body';
//@ts-ignore
import * as deepEquals from 'deep-equal';
//@ts-ignore
import * as isSubset from 'is-subset';
import * as selfSignedCertificate from './selfSignedCertificate';
import CallHistory, {Call} from './CallHistory';
import {BodyRestriction} from './models/BodyRestriction';
import FakeHttpCalls from './FakeHttpCalls';
import {sleep} from './utils';

export type MockedCall = {
    method: string;
    pathRegex: string;
    bodyRestriction?: BodyRestriction;
    queryParamsObject?: {};
    statusCode?: number;
    response?: any;
    delay?: number;
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

        app.use(function*(next: any): Iterator<void> {
            this.header['content-type'] =
                this.headers['content-type'] &&
                this.headers['content-type'].replace(';charset=UTF-8', '').replace(';charset=utf-8', '');

            yield next;
        });
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

                if (firstMatch.delay) {
                    yield sleep(firstMatch.delay);
                }

                self.logger(
                    `fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(
                        this.request.body
                    )}]. Respond with status: [${firstMatch.statusCode}] and body: [${JSON.stringify(
                        firstMatch.response
                    )}]`
                );

                this.status = firstMatch.statusCode;
                this.body = firstMatch.response;
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
        delay?: number
    ) {
        this.logger(
            `fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(
                bodyRestriction
            )}] with status [${statusCode}] with delay [${delay}] and response [${JSON.stringify(response)}]`
        );
        this.mockedCalls.push({method, pathRegex, bodyRestriction, queryParamsObject, response, statusCode, delay});
    }

    public hasMade(call: MockedCall) {
        return this.callHistory.get().some(this._getCallMatcher(call));
    }

    public callsMade(call: MockedCall) {
        return this.callHistory.get().filter(this._getCallMatcher(call));
    }

    private _getCallMatcher(call: MockedCall) {
        return (serverCall: Call) => {
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
        };
    }
}
