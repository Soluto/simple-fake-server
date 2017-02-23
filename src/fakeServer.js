"use strict";

var koa = require('koa');
var cors = require('koa-cors');
var koaBody = require('koa-body');
var deepEquals = require('deep-equal');
var isSubset = require('is-subset');

var serverCallHistory = require('./serverCallHistory');
const clearServerCallHistory = () => serverCallHistory.clear();

var FakeServer = function() {
    let mockedCalls = [];
    let server;

    return {
        start(port) {
            let app = koa();
            app.use(koaBody());
            app.use(cors());
            app.use(function *() {
                var matched = mockedCalls.filter(call => {

                    const { method, pathRegex, bodyRestriction } = call;

                    if (method !== this.req.method) {
                        return false;
                    }

                    if (!(new RegExp(pathRegex).test(this.url))) {
                        return false;
                    }

                    const contentTypeIsApplicationJson = this.request.header['content-type'] === 'application/json';

                    if (bodyRestriction.regex) {
                        const requestBodyAsString = contentTypeIsApplicationJson ? JSON.stringify(this.request.body) : this.request.body;
                        if (!(new RegExp(bodyRestriction.regex).test(requestBodyAsString))) {
                            return false;
                        }
                    }

                    if (bodyRestriction.minimalObject && (!contentTypeIsApplicationJson || !isSubset(this.request.body, bodyRestriction.minimalObject))) {
                        return false;
                    }

                    if (bodyRestriction.object && (!contentTypeIsApplicationJson || !deepEquals(this.request.body, bodyRestriction.object))) {
                        return false;
                    }

                    return true;
                });
                if (matched.length >= 1) {
	                serverCallHistory.push({method: this.req.method, path: this.url, headers: this.request.header, body: this.request.body});
                    var firstMatch = matched[matched.length-1];
                    if (firstMatch.isError) {
                        log(`fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]. Respond with error: [${firstMatch.errorStatus}]`);
                        this.status = firstMatch.errorStatus;
                    }
                    else {
                        log(`fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]. Respond with: [${JSON.stringify(firstMatch.response)}]`);
                        this.body = firstMatch.response
                    }
                }
                else {
                    log(`fakeServer:: no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`);
                    this.status = 400;
                    this.body = `no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`;
                }
            });
            clearServerCallHistory();
            server = app.listen(port || 1111);
        },

        stop() {
            server.close();
            mockedCalls = [];
        },
        
        clearCallHistory() {
            clearServerCallHistory();
        },

        set(method, pathRegex, bodyRestriction, response) {
            log(`fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(bodyRestriction)}] with response [${JSON.stringify(response)}]`);
            mockedCalls.push({ method, pathRegex, bodyRestriction, response });
        },

        setError(method, pathRegex, bodyRestriction, errorStatus) {
            log(`fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(bodyRestriction)}] with error code [${errorStatus}]`);
            mockedCalls.push({ method, pathRegex, bodyRestriction, errorStatus, isError: true });
        }
    };

    function log(message) {
        if (process.env.DEBUG) {
            browser.execute(message => {
                console.log(message);
            }, message);
        }
    }
};
module.exports = new FakeServer();