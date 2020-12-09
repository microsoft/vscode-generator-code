/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-web',
    insidersName: 'New Web Extension (TypeScript)',
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
        generator.fs.copy(generator.sourceRoot() + '/src/test', extensionConfig.name + '/src/test');

        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
        }
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/tsconfig.json', extensionConfig.name + '/tsconfig.json', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/src/web/extension.ts', extensionConfig.name + '/src/web/extension.ts', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/build/web-extension.webpack.config.js', extensionConfig.name + '/build/web-extension.webpack.config.js', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);

        generator.fs.copy(generator.sourceRoot() + '/.eslintrc.json', extensionConfig.name + '/.eslintrc.json');

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = false;
    }
}
