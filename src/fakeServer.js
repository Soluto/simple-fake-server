import https from 'https';
import queryString from 'query-string';
import koa from 'koa';
import cors from 'koa-cors';
import koaBody from 'koa-body';
import deepEquals from 'deep-equal';
import isSubset from 'is-subset';
import * as selfSignedCertificate from './selfSignedCertificate';
import serverCallHistory from './serverCallHistory';

const log = message => {
  if (!process.env.DEBUG) {
    return;
  }

  browser.execute(message => { // eslint-disable-line no-undef
    console.log(message);
  }, message);
};

const clearServerCallHistory = () => serverCallHistory.clear();

const FakeServer = function () {
  let mockedCalls = [];
  let server;

  return {
    start (port, tls = false) {
      const app = koa();

      app.use(koaBody());
      app.use(cors());
      app.use(function* () { // eslint-disable-line require-yield
        const matched = mockedCalls.filter(call => {
          const {method, pathRegex, queryParamsObject, bodyRestriction} = call;

          if (method !== this.req.method) {
            return false;
          }

          if (!(new RegExp(pathRegex).test(this.url))) {
            return false;
          }

          const contentTypeIsApplicationJson = this.request.header['content-type'] === 'application/json';

          if (queryParamsObject) {
            const splitUrl = this.url.split('?');

            if (splitUrl.length < 2) {
              return false;
            }
            const queryParamsOnUrl = queryString.parse(splitUrl[1]);

            if (!deepEquals(queryParamsOnUrl, queryParamsObject)) {
              return false;
            }
          }
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
          serverCallHistory.push({
            method: this.req.method,
            path: this.url,
            headers: this.request.header,
            body: this.request.body
          });
          const firstMatch = matched[matched.length - 1];

          if (firstMatch.isError) {
            log(`fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]. Respond with error: [${firstMatch.errorStatus}]`);
            this.status = firstMatch.errorStatus;
          }
          else {
            log(`fakeServer:: call to [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]. Respond with: [${JSON.stringify(firstMatch.response)}]`);
            this.body = firstMatch.response;
          }
        }
        else {
          log(`fakeServer:: no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`);
          this.status = 400;
          this.body = `no match for [${this.req.method} ${this.url} ${JSON.stringify(this.request.body)}]`;
        }
      });
      clearServerCallHistory();

      if (!tls) {
        server = app.listen(port || 1111);
      }
      else {
        server = https.createServer(selfSignedCertificate, app.callback()).listen(port || 1111);
      }
    },

    stop () {
      server.close();
      mockedCalls = [];
    },

    clearCallHistory () {
      clearServerCallHistory();
    },

    set (method, pathRegex, bodyRestriction, queryParamsObject, response) {
      log(`fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(bodyRestriction)}] with response [${JSON.stringify(response)}]`);
      mockedCalls.push({method, pathRegex, bodyRestriction, queryParamsObject, response});
    },

    setError (method, pathRegex, bodyRestriction, queryParamsObject, errorStatus) {
      log(`fakeServer:: registering [${method} ${pathRegex}     body restriction: ${JSON.stringify(bodyRestriction)}] with error code [${errorStatus}]`);
      mockedCalls.push({method, pathRegex, bodyRestriction, queryParamsObject, errorStatus, isError: true});
    }
  };
};

export default new FakeServer();