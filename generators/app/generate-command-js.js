/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-js',
    name: 'New Extension (JavaScript)',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        extensionConfig.checkJavaScript = false;
        await generator.prompt({
            type: 'confirm',
            name: 'checkJavaScript',
            message: 'Enable JavaScript type checking in \'jsconfig.json\'?',
            default: false
        }).then(strictJavaScriptAnswer => {
            extensionConfig.checkJavaScript = strictJavaScriptAnswer.checkJavaScript;
        });

        await prompts.askForGit(generator, extensionConfig);
        await prompts.askForPackageManager(generator, extensionConfig);
    },

    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copy(generator.sourceRoot() + '/test', extensionConfig.name + '/test');

        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');

        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
        }

        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/jsconfig.json', extensionConfig.name + '/jsconfig.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/extension.js', extensionConfig.name + '/extension.js', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/.eslintrc.json', extensionConfig.name + '/.eslintrc.json', extensionConfig);

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', extensionConfig.name + '/.yarnrc', extensionConfig);
        }

        extensionConfig.installDependencies = true;
    }
}
