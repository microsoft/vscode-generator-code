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
            generator.fs.copy(generator.templatePath('vscode-webpack'), generator.destinationPath('.vscode'));
        } else {
            generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        }
        generator.fs.copy(generator.templatePath('src/test'), generator.destinationPath('src/test'));

        generator.fs.copyTpl(generator.templatePath('vscodeignore'), generator.destinationPath('.vscodeignore'), extensionConfig);
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
        }
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('tsconfig.json'), generator.destinationPath('tsconfig.json'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('src/extension.ts'), generator.destinationPath('src/extension.ts'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);

        generator.fs.copy(generator.templatePath('.eslintrc.json'), generator.destinationPath('.eslintrc.json'));

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.templatePath('.yarnrc'), generator.destinationPath('.yarnrc'), extensionConfig);
        }

        if (extensionConfig.webpack) {
            generator.fs.copyTpl(generator.templatePath('webpack.config.js'), generator.destinationPath('webpack.config.js'), extensionConfig);
        }

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = extensionConfig.insiders;
    }
}
