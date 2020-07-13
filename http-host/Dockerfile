FROM node:10

WORKDIR /src

COPY package.json yarn.lock ./

RUN yarn

COPY . .

CMD [ "yarn", "start" ]