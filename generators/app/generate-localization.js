/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const chalk = require("chalk");

module.exports = {
    id: 'ext-localization',
    aliases: ['localization'],
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
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));
        generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
        generator.fs.copy(generator.templatePath('.gitattributes'), generator.destinationPath('.gitattributes'));

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.templatePath('.yarnrc'), generator.destinationPath('.yarnrc'), extensionConfig);
        } else if (extensionConfig.pkgManager === 'pnpm') {
            generator.fs.copyTpl(generator.templatePath('.npmrc-pnpm'), generator.destinationPath('.npmrc'), extensionConfig);
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
        if (!generator.options['extensionId']) {
            generator.options['extensionId'] = "vscode-language-pack-" + answer.lpLanguageId;
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