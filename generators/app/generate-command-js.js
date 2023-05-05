/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import Environment from "yeoman-environment";

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
        let copyPasteTemplate = ( enviroment ) => { generator.fs.copy(generator.templatePath(enviroment), generator.destinationPath(enviroment)); }
            generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
            copyPasteTemplate('test');
            copyPasteTemplate('.vscodeignore');

        ( extensionConfig.gitInit )  && ( generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore')) );

        let copyPasteExtension = ( environment ) => { generator.fs.copyTpl(generator.templatePath(environment), generator.destinationPath(environment), extensionConfig); }
            copyPasteExtension( 'README.md' );
            copyPasteExtension( 'CHANGELOG.md' );
            copyPasteExtension( 'vsc-extension-quickstart.md' );
            copyPasteExtension( 'jsconfig.json' );
            copyPasteExtension( 'extension.js' );
            copyPasteExtension( '.eslintrc.json' );

        (extensionConfig.pkgManager === 'yarn')
        ? copyPasteExtension('.yarnrc')
        : ( extensionConfig.pkgManager === 'pnpm' )
            && ( generator.fs.copyTpl(generator.templatePath('.npmrc-pnpm'), generator.destinationPath('.npmrc'), extensionConfig) );

        extensionConfig.installDependencies = true;
    }
}
