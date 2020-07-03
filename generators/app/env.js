/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var request = require('request-light');

var fallbackVersion = '^1.46.0';
var promise = request.xhr({ url: 'https://vscode-update.azurewebsites.net/api/releases/stable', headers: { "X-API-Version": "2" } }).then(res => {
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
        console.warn('Unable to fetch latest vscode version: Status code: ' + res.status + ', ' + res.responseText);
    }
    return fallbackVersion;
}, err => {
    console.warn('Unable to fetch latest vscode version: Error: ' + err);
    return fallbackVersion;
});

module.exports.getLatestVSCodeVersion = function() { return promise; };