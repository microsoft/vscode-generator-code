/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
const request = require('request-light');

const fallbackVersion = '^1.54.0';
let versionPromise = undefined;

function getLatestVSCodeVersion() {
    if (!versionPromise) {
        versionPromise = request.xhr({ url: 'https://update.code.visualstudio.com/api/releases/stable', headers: { "X-API-Version": "2" } }).then(res => {
            if (res.status === 200) {
                try {
                    var tagsAndCommits = JSON.parse(res.responseText);
                    if (Array.isArray(tagsAndCommits) && tagsAndCommits.length > 0) {
                        var segments = tagsAndCommits[0].version.split('.');
                        if (segments.length === 3) {
                            return '^' + segments[0] + '.' + segments[1] + '.0';
                        }
                    }
                } catch (e) {
                    console.log('Problem parsing version: ' + res.responseText, e);
                }
            } else {
                console.warn('Unable to evaluate the latest vscode version: Status code: ' + res.status + ', ' + res.responseText);
            }
            console.warn('Falling back to: ' + fallbackVersion);
            return fallbackVersion;
        }, err => {
            console.warn('Unable to evaluate the latest vscode version: Error: ', err);
            console.warn('Falling back to: ' + fallbackVersion);
            return fallbackVersion;
        });
    }
    return versionPromise;
};
module.exports.getLatestVSCodeVersion = getLatestVSCodeVersion;

module.exports.getDependencyVersions = async function () {
    const vscodeVersion = await getLatestVSCodeVersion();
    return {
        "@types/vscode": vscodeVersion,
        "@types/glob": "^7.1.3",
        "@types/mocha": "^8.0.4",
        "@types/node": "^12.11.7",
        "@typescript-eslint/eslint-plugin": "^4.14.1",
        "@typescript-eslint/parser": "^4.14.1",
        "eslint": "^7.19.0",
        "glob": "^7.1.6",
        "mocha": "^8.2.1",
        "typescript": "^4.1.3",
        "vscode-test": "^1.5.0",
        "@types/webpack-env": "^1.16.0",
        "@types/vscode-notebook-renderer": "^1.48.0",
        "concurrently": "^5.3.0",
        "css-loader": "^4.2.0",
        "fork-ts-checker-webpack-plugin": "^5.0.14",
        "style-loader": "^1.2.1",
        "ts-loader": "^8.0.14",
        "vscode-dts": "^0.3.1",
        "vscode-notebook-error-overlay": "^1.0.1",
        "webpack": "^5.19.0",
        "webpack-cli": "^4.4.0",
        "webpack-dev-server": "^3.11.2",
        "assert": "^2.0.0",
        "process": "^0.11.10"
    }
}

