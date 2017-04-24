/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

var path = require('path');
var fs = require('fs');
var plistParser = require('./plistParser');
var request = require('request');

function convertTheme(location, extensionConfig, inline) {
    if (!location) {
        extensionConfig.tmThemeFileName = '';
        extensionConfig.tmThemeContent = '';
    } else if (location.match(/\w*:\/\//)) {
        // load from url
        return new Promise(function (resolve, reject) {
            request(location, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var tmThemeFileName = null;
                    if (!inline) {
                        var contentDisposition = response.headers['content-disposition'];
                        if (contentDisposition) {
                            var fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
                            if (fileNameMatch) {
                                tmThemeFileName = fileNameMatch[1];
                            }
                        }
                        if (!tmThemeFileName) {
                            var lastSlash = location.lastIndexOf('/');
                            if (lastSlash) {
                                tmThemeFileName = location.substr(lastSlash + 1);
                            } else {
                                tmThemeFileName = 'theme.tmTheme';
                            }
                        }
                    }
                    processContent(extensionConfig, tmThemeFileName, body);
                    resolve();
                } else {
                    if (error) {
                        reject("Problems loading theme: " + error);
                    } else {
                        reject("Problems loading theme: HTTP status " + response.statusCode);
                    }
                }
            });
        });
    } else {
        // load from disk
        var body = null;
        try {
            body = fs.readFileSync(location);
        } catch (error) {
            return Promise.reject("Problems loading theme: " + error.message);
        }
        if (body) {
            var fileName = null;
            if (!inline) {
                fileName = path.basename(location);
            }
            processContent(extensionConfig, fileName, body.toString());
        } else {
            return Promise.reject("Problems loading theme: Not found");
        }
    }
    return Promise.resolve();
}

function processContent(extensionConfig, tmThemeFileName, body) {
    var themeNameMatch = body.match(/<key>name<\/key>\s*<string>([^<]*)/);
    var themeName = themeNameMatch ? themeNameMatch[1] : '';

    extensionConfig.themeContent = migrate(body, tmThemeFileName);
    if (tmThemeFileName) {
        if (tmThemeFileName.indexOf('.tmTheme') === -1) {
            tmThemeFileName = tmThemeFileName + '.tmTheme';
        }
        extensionConfig.tmThemeFileName = tmThemeFileName;
        extensionConfig.tmThemeContent = body;
    }
    extensionConfig.themeName = themeName;
    extensionConfig.displayName = themeName;
};

// mapping from old tmTheme setting to new workbench color ids
var mappings = {
    "background": ["editorBackground"],
    "foreground": ["editorForeground"],
    "hoverHighlight": ["editorHoverHighlight"],
    "linkForeground": ["editorLinkForeground"],
    "selection": ["editorSelection"],
    "inactiveSelection": ["editorInactiveSelection"],
    "selectionHighlightColor": ["editorSelectionHighlight"],
    "wordHighlight": ["editorWordHighlight"],
    "wordHighlightStrong": ["editorWordHighlightStrong"],
    "findMatchHighlight": ["editorFindMatchHighlight", "peekViewEditorMatchHighlight"],
    "currentFindMatchHighlight": ["editorFindMatch"],
    "findRangeHighlight": ["editorFindRangeHighlight"],
    "referenceHighlight": ["peekViewResultsMatchForeground"],
    "lineHighlight": ["editorLineHighlight"],
    "rangeHighlight": ["editorRangeHighlight"],
    "caret": ["editorCursor"],
    "invisibles": ["editorWhitespaces"],
    "guide": ["editorIndentGuides"],
    "ansiBlack": ["terminalAnsiBlack"], "ansiRed": ["terminalAnsiRed"], "ansiGreen": ["terminalAnsiGreen"], "ansiYellow": ["terminalAnsiYellow"],
    "ansiBlue": ["terminalAnsiBlue"], "ansiMagenta": ["terminalAnsiMagenta"], "ansiCyan": ["terminalAnsiCyan"], "ansiWhite": ["terminalAnsiWhite"],
    "ansiBrightBlack": ["terminalAnsiBrightBlack"], "ansiBrightRed": ["terminalAnsiBrightRed"], "ansiBrightGreen": ["terminalAnsiBrightGreen"],
    "ansiBrightYellow": ["terminalAnsiBrightYellow"], "ansiBrightBlue": ["terminalAnsiBrightBlue"], "ansiBrightMagenta": ["terminalAnsiBrightMagenta"],
    "ansiBrightCyan": ["terminalAnsiBrightCyan"], "ansiBrightWhite": ["terminalAnsiBrightWhite"]
};

function migrate(content, tmThemeFileName) {
    try {
        let result = {};
        let theme = plistParser.parse(content).value;
        let settings = theme.settings;
        if (Array.isArray(settings)) {
            let colorMap = {};
            for (let entry of settings) {
                let scope = entry.scope;
                if (scope) {
                    let parts = scope.split(',').map(p => p.trim());
                    if (parts.length > 1) {
                        entry.scope = parts;
                    }
                } else {
                    var entrySettings = entry.settings;
                    for (let entry in entrySettings) {
                        let mapping = mappings[entry];
                        if (mapping) {
                            for (let newKey of mapping) {
                                colorMap[newKey] = entrySettings[entry];
                            }
                            if (entry !== 'foreground' && entry !== 'background') {
                                delete entrySettings[entry];
                            }
                        }
                    }

                }
            }
            if (!tmThemeFileName) {
                result.tokenColors = settings;
            } else {
                result.tokenColors = './themes/' + tmThemeFileName;
            }
            result.colors = colorMap;
        }
        return result
    } catch (e) {
        console.log(e);
    }
};


exports.convertTheme = convertTheme;