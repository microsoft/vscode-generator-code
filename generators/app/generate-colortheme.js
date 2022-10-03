/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const validator = require('./validator');
const sanitize = require("sanitize-filename");
const path = require('path');
const fs = require('fs');
const plistParser = require('fast-plist');
const request = require('request-light');

module.exports = {
    id: 'ext-colortheme',
    aliases: ['colortheme'],
    name: 'New Color Theme',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {

        await askForThemeInfo(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        const nameAnswer = await generator.prompt({
            type: 'input',
            name: 'themeName',
            message: 'What\'s the name of your theme shown to the user?',
            default: extensionConfig.themeName,
            validate: validator.validateNonEmpty
        });
        extensionConfig.themeName = nameAnswer.themeName;

        const themeBase = await generator.prompt({
            type: 'list',
            name: 'themeBase',
            message: 'Select a base theme:',
            choices: [{
                name: "Dark",
                value: "vs-dark"
            },
            {
                name: "Light",
                value: "vs"
            },
            {
                name: "High Contrast Dark",
                value: "hc-black"
            },
            {
                name: "High Contrast Light",
                value: "hc-light"
            }
            ]
        });
        extensionConfig.themeBase = themeBase.themeBase;


        await prompts.askForGit(generator, extensionConfig);
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        if (extensionConfig.tmThemeFileName) {
            generator.fs.copyTpl(generator.templatePath('themes/theme.tmTheme'), generator.destinationPath('themes', extensionConfig.tmThemeFileName), extensionConfig);
        }
        extensionConfig.themeFileName = sanitize(extensionConfig.themeName + '-color-theme.json');
        if (extensionConfig.themeContent) {
            extensionConfig.themeContent.name = extensionConfig.themeName;
            generator.fs.copyTpl(generator.templatePath('themes/color-theme.json'), generator.destinationPath('themes', extensionConfig.themeFileName), extensionConfig);
        } else {
            generator.fs.copyTpl(generator.templatePath('themes/new-' + extensionConfig.themeBase + '-color-theme.json'), generator.destinationPath('themes', extensionConfig.themeFileName), extensionConfig);
        }

        generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
            generator.fs.copy(generator.templatePath('.gitattributes'), generator.destinationPath('.gitattributes'));
        }
    }
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
async function askForThemeInfo(generator, extensionConfig) {
    if (generator.options['quick']) {
        return Promise.resolve();
    }


    const answer = await generator.prompt({
        type: 'list',
        name: 'themeImportType',
        message: 'Do you want to import or convert an existing TextMate color theme?',
        choices: [
            {
                name: 'No, start fresh',
                value: 'new'
            },
            {
                name: 'Yes, import an existing theme but keep it as tmTheme file.',
                value: 'import-keep'
            },
            {
                name: 'Yes, import an existing theme and inline it in the Visual Studio Code color theme file.',
                value: 'import-inline'
            }
        ]
    });
    let type = answer.themeImportType;
    if (type === 'import-keep' || type === 'import-inline') {
        generator.log("Enter the location (URL (http, https) or file name) of the tmTheme file, e.g., http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme.");
        const urlAnswer = await generator.prompt({
            type: 'input',
            name: 'themeURL',
            message: 'URL or file name to import:'
        });
        await convertTheme(urlAnswer.themeURL, extensionConfig, type === 'import-inline', generator);
    } else {
        await convertTheme(null, extensionConfig, false, generator);
    }
}

function convertTheme(location, extensionConfig, inline, generator) {
    if (!location) {
        extensionConfig.tmThemeFileName = '';
        extensionConfig.tmThemeContent = '';
    } else if (location.match(/\w*:\/\//)) {
        // load from url
        return request.xhr({ url: location }).then(r => {
            if (r.status == 200) {
                let tmThemeFileName = null;
                if (!inline) {
                    let contentDisposition = r.headers && r.headers['content-disposition'];
                    if (Array.isArray(contentDisposition)) {
                        contentDisposition = contentDisposition[0];
                    }
                    if (typeof contentDisposition === 'string') {
                        const fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
                        if (fileNameMatch) {
                            tmThemeFileName = fileNameMatch[1];
                        }
                    }
                    if (!tmThemeFileName) {
                        const lastSlash = location.lastIndexOf('/');
                        if (lastSlash) {
                            tmThemeFileName = location.substr(lastSlash + 1);
                        } else {
                            tmThemeFileName = 'theme.tmTheme';
                        }
                    }
                }
                return processContent(extensionConfig, tmThemeFileName, r.responseText, generator);
            } else {
                return Promise.reject("Problems loading theme: HTTP status " + r.status);
            }
        });
    } else {
        // load from disk
        let body = null;
        try {
            body = fs.readFileSync(location);
        } catch (error) {
            return Promise.reject("Problems loading theme: " + error.message);
        }
        if (body) {
            let fileName = null;
            if (!inline) {
                fileName = path.basename(location);
            }
            return processContent(extensionConfig, fileName, body.toString(), generator);
        } else {
            return Promise.reject("Problems loading theme: Not found");
        }
    }
}

function processContent(extensionConfig, tmThemeFileName, body, generator) {
    const themeNameMatch = body.match(/<key>name<\/key>\s*<string>([^<]*)/);
    const themeName = themeNameMatch ? themeNameMatch[1] : '';
    try {
        extensionConfig.themeContent = migrate(body, tmThemeFileName, generator);
        if (tmThemeFileName) {
            if (tmThemeFileName.indexOf('.tmTheme') === -1) {
                tmThemeFileName = tmThemeFileName + '.tmTheme';
            }
            extensionConfig.tmThemeFileName = tmThemeFileName;
            extensionConfig.tmThemeContent = body;
        }
        extensionConfig.themeName = themeName;
        extensionConfig.displayName = themeName;
        return Promise.resolve();
    } catch (e) {
        return Promise.reject(e);
    }

};

// mapping from old tmTheme setting to new workbench color ids
const mappings = {
    "background": ["editor.background"],
    "foreground": ["editor.foreground"],
    "hoverHighlight": ["editor.hoverHighlightBackground"],
    "linkForeground": ["editorLink.foreground"],
    "selection": ["editor.selectionBackground"],
    "inactiveSelection": ["editor.inactiveSelectionBackground"],
    "selectionHighlightColor": ["editor.selectionHighlightBackground"],
    "wordHighlight": ["editor.wordHighlightBackground"],
    "wordHighlightStrong": ["editor.wordHighlightStrongBackground"],
    "findMatchHighlight": ["editor.findMatchHighlightBackground", "peekViewResult.matchHighlightBackground"],
    "currentFindMatchHighlight": ["editor.findMatchBackground"],
    "findRangeHighlight": ["editor.findRangeHighlightBackground"],
    "referenceHighlight": ["peekViewEditor.matchHighlightBackground"],
    "lineHighlight": ["editor.lineHighlightBackground"],
    "rangeHighlight": ["editor.rangeHighlightBackground"],
    "caret": ["editorCursor.foreground"],
    "invisibles": ["editorWhitespace.foreground"],
    "guide": ["editorIndentGuide.background"],
    "ansiBlack": ["terminal.ansiBlack"], "ansiRed": ["terminal.ansiRed"], "ansiGreen": ["terminal.ansiGreen"], "ansiYellow": ["terminal.ansiYellow"],
    "ansiBlue": ["terminal.ansiBlue"], "ansiMagenta": ["terminal.ansiMagenta"], "ansiCyan": ["terminal.ansiCyan"], "ansiWhite": ["terminal.ansiWhite"],
    "ansiBrightBlack": ["terminal.ansiBrightBlack"], "ansiBrightRed": ["terminal.ansiBrightRed"], "ansiBrightGreen": ["terminal.ansiBrightGreen"],
    "ansiBrightYellow": ["terminal.ansiBrightYellow"], "ansiBrightBlue": ["terminal.ansiBrightBlue"], "ansiBrightMagenta": ["terminal.ansiBrightMagenta"],
    "ansiBrightCyan": ["terminal.ansiBrightCyan"], "ansiBrightWhite": ["terminal.ansiBrightWhite"]
};

function migrate(content, tmThemeFileName, generator) {
    let result = {};
    let theme;
    try {
        theme = plistParser.parse(content);
    } catch (e) {
        throw new Error(tmThemeFileName + " not be parsed: " + e.toString());
    }
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
                const entrySettings = entry.settings;
                let notSupported = [];
                for (let entry in entrySettings) {
                    let mapping = mappings[entry];
                    if (mapping) {
                        for (let newKey of mapping) {
                            colorMap[newKey] = entrySettings[entry];
                        }
                        if (entry !== 'foreground' && entry !== 'background') {
                            delete entrySettings[entry];
                        }
                    } else {
                        notSupported.push(entry);
                    }
                }
                if (notSupported.length > 0) {
                    generator.log('Note: the following theming properties are not supported by VS Code and will be ignored: ' + notSupported.join(', '))
                }
            }
        }
        if (!tmThemeFileName) {
            result.tokenColors = settings;
        } else {
            result.tokenColors = './' + tmThemeFileName;
        }
        result.colors = colorMap;
    }
    return result;
};
