/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
const request = require('request-light');
const fs = require('fs');
const path = require('path');

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
    const versions = JSON.parse((await fs.promises.readFile(path.join(__dirname, 'dependencyVersions', 'package.json'))).toString()).dependencies;
    versions["@types/vscode"] = vscodeVersion
    return versions;
}
