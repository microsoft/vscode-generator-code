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
        generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        generator.fs.copy(generator.templatePath('test'), generator.destinationPath('test'));

        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));

        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
        }

        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('jsconfig.json'), generator.destinationPath('jsconfig.json'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('extension.js'), generator.destinationPath('extension.js'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('.eslintrc.json'), generator.destinationPath('.eslintrc.json'), extensionConfig);

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.templatePath('.yarnrc'), generator.destinationPath('.yarnrc'), extensionConfig);
        } else if (extensionConfig.pkgManager === 'pnpm') {
            generator.fs.copyTpl(generator.templatePath('.npmrc-pnpm'), generator.destinationPath('.npmrc'), extensionConfig);
        }

        extensionConfig.installDependencies = true;
    }
}
