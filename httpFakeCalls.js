var fakeServer = require("./fakeServer");

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

function create(verb) {
    return {
        to(pathRegex) {
            return Object.assign(
                withPayload(verb, pathRegex),
                will(verb, pathRegex));
        }
    }
}

function withPayload(verb, pathRegex) {
    return {
        withPayload(payloadRegex) {
            return will(verb, pathRegex, payloadRegex);
        }
    };
}

function will(verb, pathRegex, payloadRegex) {
    return {
        willReturn(response) {
            fakeServer.set(verb, pathRegex, payloadRegex, response)
        },
        willSucceed() {
            fakeServer.set(verb, pathRegex, payloadRegex, null)
        },
        willFail(errorStatus) {
            fakeServer.setError(verb, pathRegex, payloadRegex, errorStatus)
        }
    }
}
module.exports = httpFakeCalls;