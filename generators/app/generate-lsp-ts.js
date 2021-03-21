/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-lsp-ts',
    aliases: ['lsp-ts'],
    name: 'New Language Server Extension (TypeScript)',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await prompts.askForGit(generator, extensionConfig);
        await prompts.askForPackageManager(generator, extensionConfig);
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        // generator.fs.copy(generator.sourceRoot() + '/src/test', extensionConfig.name + '/src/test');

        generator.fs.copyTpl(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore', extensionConfig);
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
        }
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/tsconfig.json', extensionConfig.name + '/tsconfig.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/tsconfig.base.json', extensionConfig.name + '/tsconfig.base.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/.eslintrc.base.json', extensionConfig.name + '/.eslintrc.base.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/client', extensionConfig.name + '/client', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/client/.eslintrc.json', extensionConfig.name + '/client/.eslintrc.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/server', extensionConfig.name + '/server', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/server/.eslintrc.json', extensionConfig.name + '/server/.eslintrc.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', extensionConfig.name + '/.yarnrc', extensionConfig);
        }

        generator.fs.copyTpl(generator.sourceRoot() + '/shared.webpack.config.js', extensionConfig.name + '/shared.webpack.config.js', extensionConfig);

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = extensionConfig.insiders;
    }
}
