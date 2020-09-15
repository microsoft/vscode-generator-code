/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const chalk = require("chalk");

module.exports = {
    id: 'ext-localization',
    name: 'New Language Pack (Localization)',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {

        await askForLanguageId(generator, extensionConfig);
        await askForLanguageName(generator, extensionConfig);
        await askForLocalizedLanguageName(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await prompts.askForPackageManager(generator, extensionConfig);
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');
        generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
        generator.fs.copy(generator.sourceRoot() + '/gitattributes', extensionConfig.name + '/.gitattributes');

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', extensionConfig.name + '/.yarnrc', extensionConfig);
        }

        extensionConfig.installDependencies = true;
    },

    endMessage: (generator, extensionConfig) => {
            generator.log(chalk.yellow('Please review the "extensionPack" in the "package.json" before publishing the extension pack.'));
            generator.log('');
    }
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageId(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    generator.log("Enter the language identifier as used on transifex (e.g. bg, zh-Hant).");
    return generator.prompt({
        type: 'input',
        name: 'lpLanguageId',
        message: 'Language id:',
    }).then(answer => {
        extensionConfig.lpLanguageId = answer.lpLanguageId;
        if (!generator.options['extensionName']) {
            generator.options['extensionName'] = "vscode-language-pack-" + answer.lpLanguageId;
        }
        return Promise.resolve();
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLanguageName(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    generator.log("Enter the language name in English (e.g. 'Bulgarian', 'Dutch').");
    return generator.prompt({
        type: 'input',
        name: 'lpLanguageName',
        message: 'Language name:',
    }).then(answer => {
        extensionConfig.lpLanguageName = answer.lpLanguageName;
        if (!generator.options['extensionDisplayName']) {
            generator.options['extensionDisplayName'] = answer.lpLanguageName + " Language Pack";
        }
        if (!generator.options['extensionDescription']) {
            generator.options['extensionDescription'] = "Language pack extension for " + answer.lpLanguageName;
        }
        return Promise.resolve();
    });
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForLocalizedLanguageName(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    generator.log("Enter the language name in " + extensionConfig.lpLanguageName);
    return generator.prompt({
        type: 'input',
        name: 'lpLocalizedLanguageName',
        message: 'Localized language name:',
    }).then(answer => {
        extensionConfig.lpLocalizedLanguageName = answer.lpLocalizedLanguageName;
        return Promise.resolve();
    });
}