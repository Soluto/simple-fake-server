import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export interface With extends Will {
    withBodyThatMatches(regex: string): Will;
    withBodyThatContains(minimalObject: {}, checkCorrectContentTypeForObject: boolean): Will;
    withBody(object: {}): Will;
    withQueryParams(queryParamsObject: {}): Will;
}

export interface Will {
    willReturn(response: any, statusCode?: number, responseHeaders?: Record<string, string>): FakeRoute;
    willSucceed(): FakeRoute;
    willFail(errorStatus: number): FakeRoute;
}

export interface FakeRoute {
    call: RouteCallTester;
}

export interface FakeHttpMethod {
    to(pathRegex: string): With;
}

export default class FakeHttpCalls {
    private fakeServer: FakeServer;

    constructor(fakeServer: FakeServer) {
        this.fakeServer = fakeServer;
    }

    public post(): FakeHttpMethod {
        return this.create('POST');
    }

    // tslint:disable-next-line:no-reserved-keywords
    public get(): FakeHttpMethod {
        return this.create('GET');
    }

    public put(): FakeHttpMethod {
        return this.create('PUT');
    }

    public patch(): FakeHttpMethod {
        return this.create('PATCH');
    }

    // tslint:disable-next-line:no-reserved-keywords
    public delete(): FakeHttpMethod {
        return this.create('DELETE');
    }

    private will(method: string, pathRegex: string, bodyRestriction: BodyRestriction, queryParamsObject?: {}): Will {
        const fakeRoute: FakeRoute = {call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject)};

        return {
            willReturn: (
                response: any,
                statusCode: number = 200,
                responseHeaders: Record<string, string>
            ): FakeRoute => {
                this.fakeServer.set(
                    method,
                    pathRegex,
                    bodyRestriction,
                    queryParamsObject,
                    response,
                    statusCode,
                    responseHeaders
                );

                return fakeRoute;
            },
            willSucceed: (): FakeRoute => {
                this.fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, {}, 200, {});

                return fakeRoute;
            },
            willFail: (errorStatus: number = 500): FakeRoute => {
                this.fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, {}, errorStatus, {});

                return fakeRoute;
            },
        };
    }

    private withBodyThatMatches(method: string, pathRegex: string) {
        return {
            withBodyThatMatches: (regex: string): Will => this.will(method, pathRegex, {regex}),
        };
    }

    private withBodyThatContains(method: string, pathRegex: string) {
        return {
            withBodyThatContains: (minimalObject: {}, checkCorrectContentTypeForObject = true): Will =>
                this.will(method, pathRegex, {minimalObject, checkCorrectContentTypeForObject}),
        };
    }

    private withBody(method: string, pathRegex: string) {
        return {
            withBody: (object: {}): Will => this.will(method, pathRegex, {object}),
        };
    }

    private withQueryParams(method: string, pathRegex: string) {
        return {
            withQueryParams: (queryParamsObject: {}): Will => this.will(method, pathRegex, {}, queryParamsObject),
        };
    }

    private create(method: string): FakeHttpMethod {
        return {
            to: (pathRegex: string): With => ({
                ...this.withBodyThatMatches(method, pathRegex),
                ...this.withBodyThatContains(method, pathRegex),
                ...this.withBody(method, pathRegex),
                ...this.withQueryParams(method, pathRegex),
                ...this.will(method, pathRegex, {}),
            }),
        };
    }
}
