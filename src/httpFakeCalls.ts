import RouteCallTester from './RouteCallTester';
import {default as FakeServer} from './FakeServer';
import {BodyRestriction} from './models/BodyRestriction';

export default (fakeServer: FakeServer) => {
    const will = (method: string, pathRegex: string, bodyRestriction: BodyRestriction, queryParamsObject?: {}) => {
        const routeCallTester = {call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject)};

        return {
            willReturn(response: any) {
                fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, response);

                return routeCallTester;
            },
            willSucceed() {
                fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, null);

                return routeCallTester;
            },
            willFail(errorStatus: number) {
                fakeServer.setError(method, pathRegex, bodyRestriction, queryParamsObject, errorStatus);

                return routeCallTester;
            },
        };
    };

    const withBodyThatMatches = (method: string, pathRegex: string) => ({
        withBodyThatMatches(regex: string) {
            return will(method, pathRegex, {regex});
        },
    });

    const withBodyThatContains = (method: string, pathRegex: string) => ({
        withBodyThatContains(minimalObject: {}) {
            return will(method, pathRegex, {minimalObject});
        },
    });

    const withBody = (method: string, pathRegex: string) => ({
        withBody(object: {}) {
            return will(method, pathRegex, {object});
        },
    });

    const withQueryParams = (method: string, pathRegex: string) => ({
        withQueryParams(queryParamsObject: {}) {
            return will(method, pathRegex, {}, queryParamsObject);
        },
    });

    const create = (method: string) => ({
        to(pathRegex: string) {
            return Object.assign(
                withBodyThatMatches(method, pathRegex),
                withBodyThatContains(method, pathRegex),
                withBody(method, pathRegex),
                withQueryParams(method, pathRegex),
                will(method, pathRegex, {})
            );
        },
    });

    return {
        post: () => create('POST'),
        get: () => create('GET'),
        put: () => create('PUT'),
        delete: () => create('DELETE'),
    };
};
