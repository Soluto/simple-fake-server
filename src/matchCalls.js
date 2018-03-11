import deepEquals from 'deep-equal';
import isSubset from 'is-subset';

export default function matchCalls(call1, call2) {
    if (call2.method !== call1.method) {
        return false;
    }

    if (!new RegExp(call1.pathRegex).test(call2.path)) {
        return false;
    }

    const contentTypeIsApplicationJson = call2.headers['content-type'] === 'application/json';
    const callBodyAsString = contentTypeIsApplicationJson ? JSON.stringify(call2.body) : call2.body;

    if (call1.bodyRestriction.exactText) {
        if (callBodyAsString !== call1.bodyRestriction.exactText) {
            return false;
        }
    } else if (call1.bodyRestriction.regex) {
        if (!new RegExp(call1.bodyRestriction.regex).test(callBodyAsString)) {
            return false;
        }
    }

    if (call1.bodyRestriction.exactObject) {
        if (!deepEquals(call2.body, call1.bodyRestriction.exactObject)) {
            return false;
        }
    } else if (call1.bodyRestriction.minimalObject) {
        if (!isSubset(call2.body, call1.bodyRestriction.minimalObject)) {
            return false;
        }
    }

    return true;
}