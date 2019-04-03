import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export interface WithRestrictions extends With {
    withBodyThatMatches(regex: string): With;
    withBodyThatContains(minimalObject: {}): With;
    withBody(object: {}): With;
    withQueryParams(queryParamsObject: {}): With;
}

export interface With extends Will {
    withDelay(delay: number): With;
}

export interface Will {
    willReturn(response: any, statusCode?: number): FakeRoute;
    willSucceed(): FakeRoute;
    willFail(errorStatus?: number): FakeRoute;
}

export interface FakeRoute {
    call: RouteCallTester;
}

export interface FakeHttpMethod extends FakeHttpCallBuilder {}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export default class FakeHttpCalls {
    private fakeServer: FakeServer;

    constructor(fakeServer: FakeServer) {
        this.fakeServer = fakeServer;
    }

    public post = () => this.method('POST');
    public get = () => this.method('GET');
    public put = () => this.method('PUT');
    public patch = () => this.method('PATCH');
    public delete = () => this.method('DELETE');

    private method = (method: HTTPMethod) => new FakeHttpCallBuilder(this.fakeServer, method);
}

class FakeHttpCallBuilder {
    private fakeServer: FakeServer;
    private method: HTTPMethod;
    private pathRegex: string;
    private bodyRestriction: BodyRestriction = {};
    private queryParamsObject: object;
    private delay: number;

    constructor(fakeServer: FakeServer, method: HTTPMethod) {
        this.fakeServer = fakeServer;
        this.method = method;
    }

    public to = (pathRegex: string) => {
        this.pathRegex = pathRegex;

        return this.createWithRestrictions();
    };

    private withBodyThatMatches = (regex: string) => {
        this.bodyRestriction.regex = regex;
        return this.createWithRestrictions();
    };

    private withBodyThatContains = (minimalObject: {}) => {
        this.bodyRestriction.minimalObject = minimalObject;
        return this.createWithRestrictions();
    };

    private withBody = (object: {}) => {
        this.bodyRestriction.object = object;
        return this.createWithRestrictions();
    };

    private withQueryParams = (queryParamsObject: {}) => {
        this.queryParamsObject = queryParamsObject;
        return this.createWithRestrictions();
    };

    private withDelay = (delayMs: number) => {
        this.delay = delayMs;
        return this.createWithRestrictions();
    };

    private willReturn = (response: any, statusCode: number = 200): FakeRoute => {
        const fakeRoute: FakeRoute = {
            call: new RouteCallTester(this.method, this.pathRegex, this.bodyRestriction, this.queryParamsObject),
        };

        this.fakeServer.set(
            this.method,
            this.pathRegex,
            this.bodyRestriction,
            this.queryParamsObject,
            response,
            statusCode,
            this.delay
        );

        return fakeRoute;
    };

    private willSucceed = (): FakeRoute => this.willReturn({}, 200);

    private willFail = (errorStatus: number = 500) => this.willReturn({}, errorStatus);

    private createWithRestrictions = (): WithRestrictions => ({
        ...this.createWith(),
        withBodyThatMatches: this.withBodyThatMatches,
        withBodyThatContains: this.withBodyThatContains,
        withBody: this.withBody,
        withQueryParams: this.withQueryParams,
    });

    private createWith = (): With => ({
        ...this.createWill(),
        withDelay: this.withDelay,
    });

    private createWill = (): Will => ({
        willReturn: this.willReturn,
        willSucceed: this.willSucceed,
        willFail: this.willFail,
    });
}
