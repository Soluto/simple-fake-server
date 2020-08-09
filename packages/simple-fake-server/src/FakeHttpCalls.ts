import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export interface With extends Will {
    withBodyThatMatches(regex: string): Will;
    withBodyThatContains(partialObject: {}): Will;
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

export interface FakeHttpMethod extends With {
    to(pathRegex: string): With;
}

export default class FakeHttpCalls {
    private fakeServer: FakeServer;

    constructor(fakeServer: FakeServer) {
        this.fakeServer = fakeServer;
    }

    public post(pathRegex?: string): FakeHttpMethod {
        return this.create('POST', pathRegex);
    }

    // tslint:disable-next-line:no-reserved-keywords
    public get(pathRegex?: string): FakeHttpMethod {
        return this.create('GET', pathRegex);
    }

    public put(pathRegex?: string): FakeHttpMethod {
        return this.create('PUT', pathRegex);
    }

    public patch(pathRegex?: string): FakeHttpMethod {
        return this.create('PATCH', pathRegex);
    }

    // tslint:disable-next-line:no-reserved-keywords
    public delete(pathRegex?: string): FakeHttpMethod {
        return this.create('DELETE', pathRegex);
    }

    private will(method: string, pathRegex: string, bodyRestriction: BodyRestriction, queryParamsObject?: {}): Will {
        const fakeRoute: FakeRoute = {
            call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject),
        };

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
            withBodyThatContains: (partialObject: {}): Will => this.will(method, pathRegex, {partialObject}),
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

    private create(method: string, pathRegex?: string): FakeHttpMethod {
        return {
            to: (path: string): With => ({
                ...this.withBodyThatMatches(method, path),
                ...this.withBodyThatContains(method, path),
                ...this.withBody(method, path),
                ...this.withQueryParams(method, path),
                ...this.will(method, path, {}),
            }),
            ...this.withBodyThatMatches(method, pathRegex || ''),
            ...this.withBodyThatContains(method, pathRegex || ''),
            ...this.withBody(method, pathRegex || ''),
            ...this.withQueryParams(method, pathRegex || ''),
            ...this.will(method, pathRegex || '', {}),
        };
    }
}
