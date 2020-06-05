
/*---------------------------------------------------------
* Copyright (C) Microsoft Corporation. All rights reserved.
*--------------------------------------------------------*/
'use strict';

var path = require('path');
var fs = require('fs');
var plistParser = require('fast-plist');
var request = require('request-light');

function convertGrammar(location, extensionConfig) {
    extensionConfig.languageId = '';
    extensionConfig.languageName = '';
    extensionConfig.languageScopeName = '';
    extensionConfig.languageExtensions = [];

    if (!location) {
        extensionConfig.languageContent = '';
        return Promise.resolve();
    }

    if (location.match(/\w*:\/\//)) {
        // load from url
        return request.xhr({ url: location }).then(r => {
            if (r.status == 200) {
                var contentDisposition = r.headers && r.headers['content-disposition'];
                var fileName = '';
                if (contentDisposition) {
                    var fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
                    if (fileNameMatch) {
                        fileName = fileNameMatch[1];
                    }
                }
                return processContent(extensionConfig, fileName, r.responseText);
            } else {
                return Promise.reject("Problems loading language definition file: " + r.responseText);
            }
        });

    } else {
        // load from disk
        var body = null;
        // trim the spaces of the location path
        location = location.trim()
        try {
            body = fs.readFileSync(location);
        } catch (error) {
            return Promise.reject("Problems loading language definition file: " + error.message);
        }
        if (body) {
            return processContent(extensionConfig, path.basename(location), body.toString());
        } else {
            return Promise.reject("Problems loading language definition file: Not found");
        }
    }
}

function processContent(extensionConfig, fileName, body) {
    var languageInfo;
    if (path.extname(fileName) === '.json') {
        try {
            languageInfo = JSON.parse(body);
        } catch (e) {
            return Promise.reject("Language definition file could not be parsed asn JSON: " + e.toString());
        }
    } else {
        if (body.indexOf('<!DOCTYPE plist') === -1) {
            return Promise.reject("Language definition file does not contain 'DOCTYPE plist'. Make sure the file content is really plist-XML.");
        }

        try {
            languageInfo = plistParser.parse(body);
        } catch (e) {
            return Promise.reject("Language definition file could not be parsed: " + e.toString());
        }
    }
    if (!languageInfo) {
        return Promise.reject("Language definition file could not be parsed. Make sure it is a valid plist or JSON file.");
    }

    extensionConfig.languageName = languageInfo.name || '';

    // evaluate language id
    var languageId = '';
    var languageScopeName;

    if (languageInfo.scopeName) {
        languageScopeName = languageInfo.scopeName;

        var lastIndexOfDot = languageInfo.scopeName.lastIndexOf('.');
        if (lastIndexOfDot) {
            languageId = languageInfo.scopeName.substring(lastIndexOfDot + 1);
        }
    }
    if (!languageId && fileName) {
        var lastIndexOfDot2 = fileName.lastIndexOf('.');
        if (lastIndexOfDot2 && fileName.substring(lastIndexOfDot2 + 1) == 'tmLanguage') {
            languageId = fileName.substring(0, lastIndexOfDot2);
        }
    }
    if (!languageId && languageInfo.name) {
        languageId = languageInfo.name.toLowerCase().replace(/[^\w-_]/, '');
    }
    if (!fileName) {
        fileName = languageId + '.tmLanguage';
    }

    extensionConfig.languageFileName = fileName;
    extensionConfig.languageId = languageId;
    extensionConfig.name = languageId;
    extensionConfig.languageScopeName = languageScopeName;

    // evaluate file extensions
    if (Array.isArray(languageInfo.fileTypes)) {
        extensionConfig.languageExtensions = languageInfo.fileTypes.map(function (ft) { return '.' + ft; });
    } else {
        extensionConfig.languageExtensions = languageId ? ['.' + languageId] : [];
    }
    extensionConfig.languageContent = body;
    return Promise.resolve(extensionConfig);
};

exports.convertGrammar = convertGrammar;
