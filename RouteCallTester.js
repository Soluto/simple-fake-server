'use strict';

var serverCallHistory = require('./serverCallHistory');
var _ = require('lodash');
var deepEquals = require('deep-equal');
var isSubset = require('is-subset');

module.exports = class RouteCallTester {
	constructor(method, pathRegex, bodyRestriction) {
		this.method = method;
		this.pathRegex = pathRegex || '.*';
		this.bodyRestriction = bodyRestriction;
	}

	withPath(path) {
		if (!(new RegExp(this.pathRegex).test(path))) {
			throw new Error(`misuse: withPath() is intended to let you test calls to a specific path within the route's path regex ${this.pathRegex}. however, you called withPath() with the path ${path}, which does not match the route's path regex.`)
		}
		return new RouteCallTester(this.method, path, this.bodyRestriction);
	}

	withBodyText(bodyText) {
		const numberOfBodyRestrictionKeys = Object.keys(this.bodyRestriction).length;
		if (!(numberOfBodyRestrictionKeys === 0 || numberOfBodyRestrictionKeys === 1 && this.bodyRestriction.regex)) {
			throw new Error(`misuse: withBodyText() be called only if route was defined with a body regex or with no body restrictions`);
		}
		if (this.bodyRestriction.regex && !(new RegExp(this.bodyRestriction.regex).test(bodyText))) {
			throw new Error(`misuse: withBodyText() is intended to let you test calls with specific body within the route's body regex ${this.bodyRegex}. however, you called withBodyText() with the body ${bodyText}, which does not match the route's body regex.`)
		}
		return new RouteCallTester(this.method, this.pathRegex, { ...this.bodyRestriction, exactText: bodyText });
	}

	withSpecificBody(bodyObject) {
		const numberOfBodyRestrictionKeys = Object.keys(this.bodyRestriction).length;
		if (!(numberOfBodyRestrictionKeys === 0 || numberOfBodyRestrictionKeys === 1 && this.bodyRestriction.minimalObject)) {
			throw new Error(`misuse: withSpecificBody() be called only if route was defined with a body minimal object or with no body restrictions`);
		}
		if (this.bodyRestriction.minimalObject && !isSubset(bodyObject, this.bodyRestriction.minimalObject)) {
			throw new Error(`misuse: withSpecificBody() is intended to let you test calls with specific body object within the route's body minimal object ${this.bodyRestriction.minimalObject}. however, you called withSpecificBody() with the body ${bodyObject}, which does not match the route's body minimal object.`)
		}
		return new RouteCallTester(this.method, this.pathRegex, { ...this.bodyRestriction, exactObject: bodyObject });
	}

	hasBeenMade() {
		return _.some(serverCallHistory.get(), call => {
			if (call.method !== this.method) {
				return false;
			}

			if (!(new RegExp(this.pathRegex).test(call.path))) {
				return false;
			}

			const contentTypeIsApplicationJson = call.headers['content-type'] === 'application/json';
			const callBodyAsString = contentTypeIsApplicationJson ? JSON.stringify(call.body) : call.body;
			if (this.bodyRestriction.exactText) {
				if (callBodyAsString !== this.bodyRestriction.exactText) {
					return false;
				}
			} else if (this.bodyRestriction.regex) {
				if (!(new RegExp(this.bodyRestriction.regex).test(callBodyAsString))) {
					return false;
				}
			}

			if (this.bodyRestriction.exactObject) {
				if (!deepEquals(call.body, this.bodyRestriction.exactObject)) {
					return false;
				}
			} else if (this.bodyRestriction.minimalObject) {
				if (!(isSubset(call.body, this.bodyRestriction.minimalObject))) {
					return false;
				}
			}

			return true;
		});
	}
};