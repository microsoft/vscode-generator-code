/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-ts',
    aliases: ['ts', 'command-ts'],
    name: 'New Extension (TypeScript)',
    insidersName: 'New Extension with Proposed API (TypeScript)',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await prompts.askForGit(generator, extensionConfig);
        await prompts.askForWebpack(generator, extensionConfig);
        await prompts.askForPackageManager(generator, extensionConfig);
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        if (extensionConfig.webpack) {
            generator.fs.copy(generator.sourceRoot() + '/vscode-webpack', '.vscode');
        } else {
            generator.fs.copy(generator.sourceRoot() + '/vscode', '.vscode');
        }
        generator.fs.copy(generator.sourceRoot() + '/src/test', 'src/test');

        generator.fs.copyTpl(generator.sourceRoot() + '/vscodeignore', '.vscodeignore', extensionConfig);
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', '.gitignore');
        }
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', 'README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', 'CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', 'vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/tsconfig.json', 'tsconfig.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/src/extension.ts', 'src/extension.ts', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', 'package.json', extensionConfig);

        generator.fs.copy(generator.sourceRoot() + '/.eslintrc.json', '.eslintrc.json');

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', '.yarnrc', extensionConfig);
        }

        if (extensionConfig.webpack) {
            generator.fs.copyTpl(generator.sourceRoot() + '/webpack.config.js', 'webpack.config.js', extensionConfig);
        }

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = extensionConfig.insiders;
    }
}
