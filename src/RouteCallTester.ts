//@ts-ignore
import isSubset from 'is-subset';
import {BodyRestriction} from './models/BodyRestriction';

export default class RouteCallTester {
    method: string;
    pathRegex: string;
    bodyRestriction: BodyRestriction;
    queryParamsObject: any;

    constructor(method: string, pathRegex: string, bodyRestriction: BodyRestriction = {}, queryParamsObject?: any) {
        this.method = method;
        this.pathRegex = pathRegex || '.*';
        this.bodyRestriction = bodyRestriction;
        this.queryParamsObject = queryParamsObject;
    }

    withPath(path: string) {
        if (!new RegExp(this.pathRegex).test(path)) {
            throw new Error(
                `misuse: withPath() is intended to let you test calls to a specific path within the route's path regex ${
                    this.pathRegex
                }. however, you called withPath() with the path ${path}, which does not match the route's path regex.`
            );
        }

        return new RouteCallTester(this.method, path, this.bodyRestriction);
    }

    withBodyText(bodyText: string) {
        const numberOfBodyRestrictionKeys = Object.keys(this.bodyRestriction).length;

        if (!(numberOfBodyRestrictionKeys === 0 || (numberOfBodyRestrictionKeys === 1 && this.bodyRestriction.regex))) {
            throw new Error(
                'misuse: withBodyText() be called only if route was defined with a body regex or with no body restrictions'
            );
        }
        if (this.bodyRestriction.regex && !new RegExp(this.bodyRestriction.regex).test(bodyText)) {
            throw new Error(
                `misuse: withBodyText() is intended to let you test calls with specific body within the route's body regex ${
                    this.bodyRestriction.regex
                }. however, you called withBodyText() with the body ${bodyText}, which does not match the route's body regex.`
            );
        }

        return new RouteCallTester(this.method, this.pathRegex, {...this.bodyRestriction, exactText: bodyText});
    }

    withSpecificBody(bodyObject: {}) {
        const numberOfBodyRestrictionKeys = Object.keys(this.bodyRestriction).length;

        if (
            !(
                numberOfBodyRestrictionKeys === 0 ||
                (numberOfBodyRestrictionKeys === 1 && this.bodyRestriction.minimalObject)
            )
        ) {
            throw new Error(
                'misuse: withSpecificBody() be called only if route was defined with a body minimal object or with no body restrictions'
            );
        }
        if (this.bodyRestriction.minimalObject && !isSubset(bodyObject, this.bodyRestriction.minimalObject)) {
            throw new Error(
                `misuse: withSpecificBody() is intended to let you test calls with specific body object within the route's body minimal object ${
                    this.bodyRestriction.minimalObject
                }. however, you called withSpecificBody() with the body ${bodyObject}, which does not match the route's body minimal object.`
            );
        }

        return new RouteCallTester(this.method, this.pathRegex, {...this.bodyRestriction, exactObject: bodyObject});
    }
}
