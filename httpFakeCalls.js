"use strict";

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
                withBodyThatContains(method, pathRegex),
                withBody(method, pathRegex),
                will(method, pathRegex, {}));
        }
    }
}

function withBodyThatMatches(method, pathRegex) {
    return {
        withBodyThatMatches(regex) {
            return will(method, pathRegex, { regex });
        }
    };
}
    
function withBodyThatContains(method, pathRegex) {
    return {
        withBodyThatContains(minimalObject) {
            return will(method, pathRegex, { minimalObject });
        }
    };
}

function withBody(method, pathRegex) {
    return {
        withBody(object) {
            return will(method, pathRegex, { object });
        }
    };
}

function will(method, pathRegex, bodyRestriction) {
    const routeCallTester = { call: new RouteCallTester(method, pathRegex, bodyRestriction) };
    return {
        willReturn(response) {
            fakeServer.set(method, pathRegex, bodyRestriction, response);
            return routeCallTester;
        },
        willSucceed() {
            fakeServer.set(method, pathRegex, bodyRestriction, null);
            return routeCallTester;
        },
        willFail(errorStatus) {
            fakeServer.setError(method, pathRegex, bodyRestriction, errorStatus);
            return routeCallTester;
        }
    }
}

module.exports = httpFakeCalls;