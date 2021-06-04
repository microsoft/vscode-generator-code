/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-command-web',
    aliases: ['web', 'command-web'],
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
        generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        generator.fs.copy(generator.templatePath('src/web/test'), generator.destinationPath('src/web/test'));

        generator.fs.copy(generator.templatePath('vscodeignore'), generator.destinationPath('.vscodeignore'));
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
        }
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('tsconfig.json'), generator.destinationPath('tsconfig.json'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('src/web/extension.ts'), generator.destinationPath('src/web/extension.ts'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('build/web-extension.webpack.config.js'), generator.destinationPath('build/web-extension.webpack.config.js'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);

        generator.fs.copy(generator.templatePath('.eslintrc.json'), generator.destinationPath('.eslintrc.json'));

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = false;
    }
}
