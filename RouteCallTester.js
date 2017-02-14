'use strict';

var serverCallHistory = require('./serverCallHistory');
var _ = require('lodash');

module.exports = class RouteCallTester {
	constructor(method, pathRegex, bodyRegex) {
		this.method = method;
		this.pathRegex = pathRegex || '.*';
		this.bodyRegex = bodyRegex || '.*';
	}

	withPath(path) {
		if (!(new RegExp(this.pathRegex).test(path))) {
			throw new Error(`misuse: withPath() is intended to let you test calls to a specific path within the route's path regex ${this.pathRegex}. however, you called withPath() with the path ${path}, which does not match the route's path regex.`)
		}
		return new RouteCallTester(this.method, path, this.bodyRegex);
	}

	withBody(body) {
		if (!(new RegExp(this.bodyRegex).test(body))) {
			throw new Error(`misuse: withBody() is intended to let you test calls with specific body within the route's body regex ${this.bodyRegex}. however, you called withBody() with the body ${body}, which does not match the route's body regex.`)
		}
		return new RouteCallTester(this.method, this.pathRegex, body);
	}

	hasBeenMade() {
		return _.some(serverCallHistory.get(), call =>
			call.method === this.method &&
			new RegExp(this.pathRegex).test(call.path) &&
			new RegExp(this.bodyRegex).test(call.body)
		);
	}
};