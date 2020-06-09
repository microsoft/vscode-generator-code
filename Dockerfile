FROM node:lts-alpine3.12
LABEL Maintainer="contact@snpranav.com"

# Install GIT
RUN apk --update add git less openssh && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

# Installing Yeoman and VS Code Extension Generator globally
RUN npm install -g yo generator-code
RUN chown -R node:node /usr/local/lib/node_modules

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN chown -R node:node /usr/src/app
USER node
ENTRYPOINT [ "yo", "code" ]