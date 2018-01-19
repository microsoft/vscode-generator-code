"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
let i18n = require("../../vscode/build/lib/i18n");

let fs = require("fs");
let path = require("path");
let vfs = require("vinyl-fs");
let rimraf = require('rimraf');

function update() {
    let vsCodeStat = fs.statSync('../vscode');
    if (!vsCodeStat || !vsCodeStat.isDirectory) {
        throw new Error('To update, language pack must be placed in the same directory as a current vscode repository');
    }
    let langPackFolder = process.cwd();
    process.chdir('../vscode');
    let packageJSON = JSON.parse(fs.readFileSync(path.join(langPackFolder, 'package.json')).toString());
    let contributes = packageJSON['contributes'];
    if (!contributes || !contributes['languagePack']) {
        throw new Error('Extension must define a "languagePack" contribution in the "package.json"');
    }
    let languagePackInfo = contributes['languagePack'];
    if (!languagePackInfo.languageId) {
        throw new Error('The languagePack contribution must contain at least a "languageId" entry.');
    }
    let server = languagePackInfo.server || 'www.transifex.com';
    let userName = languagePackInfo.userName || 'api';
    let apiToken = process.env.TRANSIFEX_API_TOKEN;
    let languageId = languagePackInfo.languageId;
    let translationDataFolder = path.join(langPackFolder, 'translations');
    rimraf.sync(translationDataFolder);

    i18n.pullBuildXlfFiles(server, userName, apiToken, { id: languageId })
        .pipe(i18n.prepareI18nPackFiles())
        .pipe(vfs.dest(translationDataFolder));
}
update();
