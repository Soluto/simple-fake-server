import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export interface Matchers extends With {
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

        return this.createMatchers();
    };

    private withBodyThatMatches = (regex: string) => {
        this.bodyRestriction.regex = regex;
        return this.createMatchers();
    };

    private withBodyThatContains = (minimalObject: {}) => {
        this.bodyRestriction.minimalObject = minimalObject;
        return this.createMatchers();
    };

    private withBody = (object: {}) => {
        this.bodyRestriction.object = object;
        return this.createMatchers();
    };

    private withQueryParams = (queryParamsObject: {}) => {
        this.queryParamsObject = queryParamsObject;
        return this.createMatchers();
    };

    private withDelay = (delayMs: number) => {
        this.delay = delayMs;
        return this.createMatchers();
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

    private createMatchers = (): Matchers => ({
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
