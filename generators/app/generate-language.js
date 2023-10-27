/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import Generator from 'yeoman-generator';
import * as prompts from './prompts.js';
import * as path from 'path';
import * as fs from 'fs';
import * as plistParser from 'fast-plist';
import request from 'request-light';
import * as validator from './validator.js';

export default {
    id: 'ext-language',
    aliases: ['language'],
    name: 'New Language Support',
    /**
     * @param {Generator} generator
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
     * @param {Generator} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        if (!extensionConfig.languageContent) {
            extensionConfig.languageFileName = validator.sanitizeFilename(extensionConfig.languageId + '.tmLanguage.json');

            generator.fs.copyTpl(generator.templatePath('syntaxes/new.tmLanguage.json'), generator.destinationPath('syntaxes', extensionConfig.languageFileName), extensionConfig);
        } else {
            generator.fs.copyTpl(generator.templatePath('syntaxes/language.tmLanguage'), generator.destinationPath('syntaxes', validator.sanitizeFilename(extensionConfig.languageFileName)), extensionConfig);
        }

        generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('language-configuration.json'), generator.destinationPath('language-configuration.json'), extensionConfig);
        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
            generator.fs.copy(generator.templatePath('.gitattributes'), generator.destinationPath('.gitattributes'));
        }
    }
}
/**
 * @param {Generator} generator
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
 * @param {Generator} generator
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
 * @param {Generator} generator
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
 * @param {Generator} generator
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
 * @param {Generator} generator
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
                let contentDisposition = r.headers && r.headers['content-disposition'];
                if (Array.isArray(contentDisposition)) {
                    contentDisposition = contentDisposition[0];
                }
                let fileName = '';
                if (contentDisposition) {
                    const fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
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
        let body = null;
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
    let languageInfo;
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
    let languageId = '';
    let languageScopeName;

    if (languageInfo.scopeName) {
        languageScopeName = languageInfo.scopeName;

        const lastIndexOfDot = languageInfo.scopeName.lastIndexOf('.');
        if (lastIndexOfDot) {
            languageId = languageInfo.scopeName.substring(lastIndexOfDot + 1);
        }
    }
    if (!languageId && fileName) {
        const lastIndexOfDot2 = fileName.lastIndexOf('.');
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
