/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
import request from 'request-light';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const fallbackVersion = '^1.103.0';
let versionPromise = undefined;

export function getLatestVSCodeVersion() {
    if (!versionPromise) {
        // Fetch the latest published @types/vscode version from the npm registry
        // and return a caret-pinned range (e.g. ^1.93.0).
        versionPromise = request
            .xhr({ url: 'https://registry.npmjs.org/@types/vscode/latest', headers: { 'Accept': 'application/json' } })
            .then(
                res => {
                    if (res.status === 200) {
                        try {
                            const meta = JSON.parse(res.responseText);
                            if (meta && typeof meta.version === 'string' && meta.version) {
                                return '^' + meta.version;
                            }
                        } catch (e) {
                            console.log('Problem parsing @types/vscode metadata: ' + res.responseText, e);
                        }
                    } else {
                        console.warn('Unable to evaluate the latest @types/vscode version: Status code: ' + res.status + ', ' + res.responseText);
                    }
                    console.warn('Falling back to: ' + fallbackVersion);
                    return fallbackVersion;
                },
                err => {
                    console.warn('Unable to evaluate the latest @types/vscode version: Error: ', err);
                    console.warn('Falling back to: ' + fallbackVersion);
                    return fallbackVersion;
                }
            );
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
