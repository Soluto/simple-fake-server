FROM node:10

WORKDIR /src

COPY packages/http-host/package.json yarn.lock ./

RUN yarn

COPY packages/http-host/. .

CMD [ "yarn", "start" ]