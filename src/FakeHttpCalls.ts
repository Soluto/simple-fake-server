import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export default class FakeHttpCalls {
    private fakeServer: FakeServer;

    constructor(fakeServer: FakeServer) {
        this.fakeServer = fakeServer;
    }

    public post() {
        return this.create('POST');
    }

    // tslint:disable-next-line:no-reserved-keywords
    public get() {
        return this.create('GET');
    }

    public put() {
        return this.create('PUT');
    }

    public patch() {
        return this.create('PATCH');
    }

    // tslint:disable-next-line:no-reserved-keywords
    public delete() {
        return this.create('DELETE');
    }

    private will(method: string, pathRegex: string, bodyRestriction: BodyRestriction, queryParamsObject?: {}) {
        const routeCallTester = {call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject)};

        return {
            willReturn: (response: any, statusCode?: number) => {
                this.fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, response, statusCode);

                return routeCallTester;
            },
            willSucceed: () => {
                this.fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, null);

                return routeCallTester;
            },
            willFail: (errorStatus: number) => {
                this.fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, null, errorStatus);

                return routeCallTester;
            },
        };
    }

    private withBodyThatMatches(method: string, pathRegex: string) {
        return {
            withBodyThatMatches: (regex: string) => this.will(method, pathRegex, {regex}),
        };
    }

    private withBodyThatContains(method: string, pathRegex: string) {
        return {
            withBodyThatContains: (minimalObject: {}) => this.will(method, pathRegex, {minimalObject}),
        };
    }

    private withBody(method: string, pathRegex: string) {
        return {
            withBody: (object: {}) => this.will(method, pathRegex, {object}),
        };
    }

    private withQueryParams(method: string, pathRegex: string) {
        return {
            withQueryParams: (queryParamsObject: {}) => this.will(method, pathRegex, {}, queryParamsObject),
        };
    }

    private create(method: string) {
        return {
            to: (pathRegex: string) => ({
                ...this.withBodyThatMatches(method, pathRegex),
                ...this.withBodyThatContains(method, pathRegex),
                ...this.withBody(method, pathRegex),
                ...this.withQueryParams(method, pathRegex),
                ...this.will(method, pathRegex, {}),
            }),
        };
    }
}
