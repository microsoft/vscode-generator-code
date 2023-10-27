/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import request from 'request-light';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const fallbackVersion = '^1.54.0';
let versionPromise = undefined;

export function getLatestVSCodeVersion() {
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

export async function getDependencyVersions() {
    const vscodeVersion = await getLatestVSCodeVersion();
    const currentFileName = fileURLToPath(import.meta.url);
    const versions = JSON.parse((await fs.promises.readFile(path.join(currentFileName, '..', 'dependencyVersions', 'package.json'))).toString()).dependencies;
    versions["@types/vscode"] = vscodeVersion
    return versions;
}
