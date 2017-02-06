var fakeServer = require('./fakeServer');
var RouteCallTester = require('./RouteCallTester');

var httpFakeCalls = {
    post() {
        return create("POST")
    },

    get() {
        return create("GET")
    },

    put() {
        return create("PUT")
    }
};

function create(method) {
    return {
        to(pathRegex) {
            return Object.assign(
                withBodyThatMatches(method, pathRegex),
                will(method, pathRegex));
        }
    }
}

function withBodyThatMatches(method, pathRegex) {
    return {
        withBodyThatMatches(bodyRegex) {
            return will(method, pathRegex, bodyRegex);
        }
    };
}

function will(method, pathRegex, bodyRegex) {
    const routeCallTester = { call: new RouteCallTester(method, pathRegex, bodyRegex) };
    return {
        willReturn(response) {
            fakeServer.set(method, pathRegex, bodyRegex, response);
            return routeCallTester;
        },
        willSucceed() {
            fakeServer.set(method, pathRegex, bodyRegex, null);
            return routeCallTester;
        },
        willFail(errorStatus) {
            fakeServer.setError(method, pathRegex, bodyRegex, errorStatus);
            return routeCallTester;
        }
    }
}
module.exports = httpFakeCalls;