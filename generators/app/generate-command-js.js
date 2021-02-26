/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-js',
    aliases: ['js', 'command-js'],
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
        generator.fs.copy(generator.sourceRoot() + '/vscode', '.vscode');
        generator.fs.copy(generator.sourceRoot() + '/test', 'test');

        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', '.vscodeignore');

        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', '.gitignore');
        }

        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', 'README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', 'CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', 'vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/jsconfig.json', 'jsconfig.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/extension.js', 'extension.js', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', 'package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/.eslintrc.json', '.eslintrc.json', extensionConfig);

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', '.yarnrc', extensionConfig);
        }

        extensionConfig.installDependencies = true;
    }
}
