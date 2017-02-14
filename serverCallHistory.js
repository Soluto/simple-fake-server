'use strict';

let history = [];

module.exports = {
	get() {
		return history;
	},

	push(serverCall) {
		history.push(serverCall);
	},

	clear() {
		history = [];
	}
};
