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
    },

    delete() {
        return create("DELETE")
    }
};

function create(method) {
    return {
        to(pathRegex) {
            return Object.assign(
                withBodyThatMatches(method, pathRegex),
                withBodyThatContains(method, pathRegex),
                withBody(method, pathRegex),
                withQueryParams(method, pathRegex),
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

function withQueryParams(method, pathRegex) {
    return {
        withQueryParams(queryParamsObject) {
            return will(method, pathRegex, {}, queryParamsObject);
        }
    };
}

function will(method, pathRegex, bodyRestriction, queryParamsObject) {
    const routeCallTester = { call: new RouteCallTester(method, pathRegex, bodyRestriction, queryParamsObject) };
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
    }
}

module.exports = httpFakeCalls;