"use strict";

var koa = require('koa');
var cors = require('koa-cors');
var koaBody   = require('koa-body');

var FakeServer = function() {
    let mockedCalls = [];
    let server;

    return {
        start(port) {
            let app = koa();
            app.use(koaBody());
            app.use(cors());
            app.use(function *(){
                var matched = mockedCalls.filter(call => {
                    var verb = call.command.split(' ')[0];
                    var pathRegex = call.command.split(' ')[1];
                    var payloadRegex = call.command.split(' ')[2];
                    return verb === this.req.method
                        && new RegExp(pathRegex).test(this.url)
                        && new RegExp(payloadRegex).test(JSON.stringify(this.request.body));
                });
                if (matched.length >= 1) {
                    var firstMatch = matched[matched.length-1];
                    if (firstMatch.isError) {
                        let command = _createCommand(this.req.method, this.url, JSON.stringify(this.request.body));
                        log("fakeServer:: call to [" + command + "]. Respond with error: ["+firstMatch.errorStatus+"]");
                        this.status = firstMatch.errorStatus;
                    }
                    else {
                        let command = _createCommand(this.req.method, this.url, JSON.stringify(this.request.body));
                        log("fakeServer:: call to [" + command + "]. Respond with: [" + JSON.stringify(matched[matched.length-1].response) + "]");
                        this.body = matched[matched.length-1].response
                    }
                }
                else {
                    let command = _createCommand(this.req.method, this.url, JSON.stringify(this.request.body));
                    log("fakeServer:: no match for [" + command + "]");
                    this.status = 400;
                    this.body = "no match for [" + command + "]";
                }
            });
            server = app.listen(port || 1111);
        },

        stop() {
            server.close();
            mockedCalls = [];
        },

        set(verb, path, payloadRegex, response) {
            payloadRegex = payloadRegex || ".*";
            let command = _createCommand(verb, path, payloadRegex);
            log("fakeServer:: registering [" + command + "] with response [" + JSON.stringify(response) + "]");
            mockedCalls.push({command: command, response: response});
        },

        setError(verb, path, payloadRegex, errorStatus) {
            payloadRegex = payloadRegex || ".*";
            let command = _createCommand(verb, path, payloadRegex);
            log("fakeServer:: registering [" + command + "] with error code ["+errorStatus+"]");
            mockedCalls.push({command: command, isError: true, errorStatus: errorStatus});
        }
    };

    function _createCommand(verb, pathRegex, payload) {
        return verb + " " + pathRegex + " " + payload;
    }

    function log(message) {
        if (process.env.DEBUG) {
            browser.execute(message => {
                console.log(message);
            }, message);
        }
    }
};
module.exports = new FakeServer();