FROM node:22-alpine
LABEL Maintainer="contact@snpranav.com"

# Installing GIT
RUN apk update && apk add git

# Installing Yeoman and VS Code Extension Generator globally
RUN npm install -g yo generator-code \
    && chown -R node:node /usr/local/lib/node_modules

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN chown -R node:node /usr/src/app
USER node
ENTRYPOINT [ "yo", "code" ]
