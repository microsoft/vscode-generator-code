/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';


exports.askForLocalizationLanguageId = function (generator) {
    if (generator.extensionConfig.type !== 'ext-localization') {
        return Promise.resolve();
    }
    generator.extensionConfig.isCustomization = true;
    generator.log("Enter the language identifier as used on transifex (e.g. bg, zh-Hant).");
    return generator.prompt({
        type: 'input',
        name: 'lpLanguageId',
        message: 'Language id:',
    }).then(function (answer) {
        generator.extensionConfig.lpLanguageId = answer.lpLanguageId;
        if (!generator.extensionName) {
            generator.extensionName = "vscode-localization-" + answer.lpLanguageId;
        }
        return Promise.resolve();
    });
}

exports.askForLocalizationLanguageName = function (generator) {
    if (generator.extensionConfig.type !== 'ext-localization') {
        return Promise.resolve();
    }
    generator.extensionConfig.isCustomization = true;
    generator.log("Enter the language name in English (e.g. Bulgarian, Traditional Chinese).");
    return generator.prompt({
        type: 'input',
        name: 'lpLanguageName',
        message: 'Language name:',
    }).then(function (answer) {
        generator.extensionConfig.lpLanguageName = answer.lpLanguageName;
        if (!generator.extensionDisplayName) {
            generator.extensionDisplayName = answer.lpLanguageName + " Localization";
        }
        if (!generator.extensionDescription) {
            generator.extensionDescription = "Localization extension for " + answer.lpLanguageName;
        }
        return Promise.resolve();
    });
}

exports.writingLocalizationExtension = function (generator) {

    var context = generator.extensionConfig;

    generator.directory(generator.sourceRoot() + '/build', context.name + '/build');
    generator.template(generator.sourceRoot() + '/package.json', context.name + '/package.json', context);
    generator.template(generator.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
    generator.template(generator.sourceRoot() + '/README.md', context.name + '/README.md', context);
    generator.template(generator.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
    generator.copy(generator.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
    generator.copy(generator.sourceRoot() + '/gitignore', context.name + '/.gitignore');

    context.installDependencies = true;
}