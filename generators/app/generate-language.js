/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
let sanitize = require("sanitize-filename");
let grammarConverter = require('./grammarConverter');

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
    }).then(urlAnswer => {
        return grammarConverter.convertGrammar(urlAnswer.tmLanguageURL, extensionConfig);
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

