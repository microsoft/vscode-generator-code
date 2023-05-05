/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const chalk = require("chalk");
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
        let copyPaste_Template = ( enviroment ) => { generator.fs.copy(generator.templatePath( enviroment ), generator.destinationPath( enviroment )); }
        let copyPaste_Template_Origin_Destination = ( origin, destination ) => { generator.fs.copy(generator.templatePath( origin ), generator.destinationPath( destination )); }

        let copyPaste_Extension = ( enviroment ) => { generator.fs.copyTpl(generator.templatePath( enviroment ), generator.destinationPath( enviroment ), extensionConfig); }
        let copyPaste_Extension_Origin_Destination = ( origin, destination ) => { generator.fs.copyTpl(generator.templatePath( origin ), generator.destinationPath( destination ), extensionConfig); }

        if (extensionConfig.webpack) {
            copyPaste_Template_Origin_Destination ( 'vscode-webpack/vscode', '.vscode' );

            copyPaste_Extension_Origin_Destination ('vscode-webpack/package.json', 'package.json');
            copyPaste_Extension_Origin_Destination ('vscode-webpack/tsconfig.json', 'tsconfig.json');
            copyPaste_Extension_Origin_Destination ('vscode-webpack/.vscodeignore', '.vscodeignore');
            copyPaste_Extension_Origin_Destination ('vscode-webpack/webpack.config.js', 'webpack.config.js');
            copyPaste_Extension_Origin_Destination ('vscode-webpack/vsc-extension-quickstart.md', 'vsc-extension-quickstart.md');
        } else {
            copyPaste_Template_Origin_Destination('vscode','.vscode');

            copyPaste_Extension ('package.json');
            copyPaste_Extension ('tsconfig.json');
            copyPaste_Extension ('.vscodeignore');
            copyPaste_Extension ('vsc-extension-quickstart.md');
        }

        ( extensionConfig.gitInit )  &&  copyPaste_Template_Origin_Destination('gitignore', '.gitignore');

        copyPaste_Extension('README.md');
        copyPaste_Extension('CHANGELOG.md');
        copyPaste_Extension('src/extension.ts');
        copyPaste_Template('src/test');
        copyPaste_Template('.eslintrc.json');

        (extensionConfig.pkgManager === 'yarn')
        ? copyPaste_Extension('.yarnrc')
        : (extensionConfig.pkgManager === 'pnpm')
            && copyPaste_Extension_Origin_Destination('.npmrc-pnpm','.npmrc');

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = extensionConfig.insiders;
    },

    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    endMessage: (generator, extensionConfig) => {
        if (extensionConfig.webpack) {
            generator.log(chalk.yellow(`To run the extension you need to install the recommended extension 'amodio.tsl-problem-matcher'.`));
            generator.log('');
        }
    }
}
