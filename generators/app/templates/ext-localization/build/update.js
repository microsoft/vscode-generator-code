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
        throw new Error('To update, the localization extension must be placed in the same directory as a current vscode repository');
    }
    let langPackFolder = process.cwd();
    process.chdir('../vscode');
    let packageJSON = JSON.parse(fs.readFileSync(path.join(langPackFolder, 'package.json')).toString());
    let contributes = packageJSON['contributes'];
    if (!contributes) {
        throw new Error('The extension must define a "localizations" contribution in the "package.json"');
    }
    let localizations = contributes['localizations'];
    if (!localizations) {
        throw new Error('The extension must define a "localizations" contribution of type array in the "package.json"');
    }
    localizations.forEach(function (localization) {
        if (!localization.languageId || !localization.languageName || !localization.translations) {
            throw new Error('Each localization contribution must define "languageId", "languageName" and "translations" properties.');
        }
        let server = localization.server || 'www.transifex.com';
        let userName = localization.userName || 'api';
        let apiToken = process.env.TRANSIFEX_API_TOKEN;
        let languageId = localization.languageId;
        let translationDataFolder = path.join(langPackFolder, localization.translations);

        if (fs.existsSync(translationDataFolder) && fs.existsSync(path.join(translationDataFolder, 'main.i18n.json'))) {
            console.log('Clearing  \'' + translationDataFolder + '\'...');
            rimraf.sync(translationDataFolder);
        }

        console.log('Downloading translations to \'' + translationDataFolder + '\'...');
        i18n.pullBuildXlfFiles(server, userName, apiToken, { id: languageId })
            .pipe(i18n.prepareI18nPackFiles())
            .pipe(vfs.dest(translationDataFolder));
    });


}
update();
