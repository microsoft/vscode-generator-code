/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-ts',
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
            generator.fs.copy(generator.sourceRoot() + '/vscode-webpack', extensionConfig.name + '/.vscode');
        } else {
            generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        }
        generator.fs.copy(generator.sourceRoot() + '/src/test', extensionConfig.name + '/src/test');

        generator.fs.copyTpl(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore', extensionConfig);
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
        }
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/tsconfig.json', extensionConfig.name + '/tsconfig.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/src/extension.ts', extensionConfig.name + '/src/extension.ts', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);

        generator.fs.copy(generator.sourceRoot() + '/.eslintrc.json', extensionConfig.name + '/.eslintrc.json');

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', extensionConfig.name + '/.yarnrc', extensionConfig);
        }

        if (extensionConfig.webpack) {
            generator.fs.copyTpl(generator.sourceRoot() + '/build/node-extension.webpack.config.js', extensionConfig.name + '/build/node-extension.webpack.config.js', extensionConfig);
        }

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = extensionConfig.insiders;
    }
}
