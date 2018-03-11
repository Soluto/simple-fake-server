import RouteCallTester from './RouteCallTester';

export default fakeServer => {
    const will = (method, pathRegex, bodyRestriction, queryParamsObject?) => {
        const routeCallTester = {call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject)};

        return {
            willReturn(response) {
                fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, response);

                return routeCallTester;
            },
            willSucceed() {
                fakeServer.set(method, pathRegex, bodyRestriction, queryParamsObject, null);

                return routeCallTester;
            },
            willFail(errorStatus) {
                fakeServer.setError(method, pathRegex, bodyRestriction, queryParamsObject, errorStatus);

                return routeCallTester;
            }
        };
    };

    const withBodyThatMatches = (method, pathRegex) => ({
        withBodyThatMatches(regex) {
            return will(method, pathRegex, {regex});
        }
    });

    const withBodyThatContains = (method, pathRegex) => ({
        withBodyThatContains(minimalObject) {
            return will(method, pathRegex, {minimalObject});
        }
    });

    const withBody = (method, pathRegex) => ({
        withBody(object) {
            return will(method, pathRegex, {object});
        }
    });

    const withQueryParams = (method, pathRegex) => ({
        withQueryParams(queryParamsObject) {
            return will(method, pathRegex, {}, queryParamsObject);
        }
    });

    const create = method => ({
        to(pathRegex) {
            return Object.assign(
                withBodyThatMatches(method, pathRegex),
                withBodyThatContains(method, pathRegex),
                withBody(method, pathRegex),
                withQueryParams(method, pathRegex),
                will(method, pathRegex, {}));
        }
    });

    return {
        post: () => create('POST'),
        get: () => create('GET'),
        put: () => create('PUT'),
        delete: () => create('DELETE')
    }
};
