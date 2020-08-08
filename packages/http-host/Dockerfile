FROM node:10

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn

COPY ./src .

CMD [ "yarn", "start" ]