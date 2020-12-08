/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const sanitize = require("sanitize-filename");
const path = require('path');
const fs = require('fs');
const plistParser = require('fast-plist');
const request = require('request-light');

module.exports = {
    id: 'ext-language',
    name: 'New Language Support',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await askForLanguageInfo(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await askForLanguageId(generator, extensionConfig);
        await askForLanguageName(generator, extensionConfig);
        await askForLanguageExtensions(generator, extensionConfig);
        await askForLanguageScopeName(generator, extensionConfig);

        await prompts.askForGit(generator, extensionConfig);

    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        if (!extensionConfig.languageContent) {
            extensionConfig.languageFileName = sanitize(extensionConfig.languageId + '.tmLanguage.json');

            generator.fs.copyTpl(generator.sourceRoot() + '/syntaxes/new.tmLanguage.json', extensionConfig.name + '/syntaxes/' + extensionConfig.languageFileName, extensionConfig);
        } else {
            generator.fs.copyTpl(generator.sourceRoot() + '/syntaxes/language.tmLanguage', extensionConfig.name + '/syntaxes/' + sanitize(extensionConfig.languageFileName), extensionConfig);
        }

        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/language-configuration.json', extensionConfig.name + '/language-configuration.json', extensionConfig);
        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
            generator.fs.copy(generator.sourceRoot() + '/gitattributes', extensionConfig.name + '/.gitattributes');
        }
    }
}
/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageInfo(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    generator.log("Enter the URL (http, https) or the file path of the tmLanguage grammar or press ENTER to start with a new grammar.");
    return generator.prompt({
        type: 'input',
        name: 'tmLanguageURL',
        message: 'URL or file to import, or none for new:',
        default: ''
    }).then(urlAnswer => {
        return convertGrammar(urlAnswer.tmLanguageURL, extensionConfig);
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageId(generator, extensionConfig) {
    generator.log('Enter the id of the language. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
    return generator.prompt({
        type: 'input',
        name: 'languageId',
        message: 'Language id:',
        default: extensionConfig.languageId,
    }).then(idAnswer => {
        extensionConfig.languageId = idAnswer.languageId;
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageName(generator, extensionConfig) {
    generator.log('Enter the name of the language. The name will be shown in the VS Code editor mode selector.');
    return generator.prompt({
        type: 'input',
        name: 'languageName',
        message: 'Language name:',
        default: extensionConfig.languageName,
    }).then(nameAnswer => {
        extensionConfig.languageName = nameAnswer.languageName;
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageExtensions(generator, extensionConfig) {
    generator.log('Enter the file extensions of the language. Use commas to separate multiple entries (e.g. .ruby, .rb)');
    return generator.prompt({
        type: 'input',
        name: 'languageExtensions',
        message: 'File extensions:',
        default: extensionConfig.languageExtensions.join(', '),
    }).then(extAnswer => {
        extensionConfig.languageExtensions = extAnswer.languageExtensions.split(',').map(e => { return e.trim(); });
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageScopeName(generator, extensionConfig) {
    generator.log('Enter the root scope name of the grammar (e.g. source.ruby)');
    return generator.prompt({
        type: 'input',
        name: 'languageScopeName',
        message: 'Scope names:',
        default: extensionConfig.languageScopeName,
    }).then(extAnswer => {
        extensionConfig.languageScopeName = extAnswer.languageScopeName;
    });
}

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
