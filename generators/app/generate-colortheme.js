/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const validator = require('./validator');
const themeConverter = require('./themeConverter');
let sanitize = require("sanitize-filename");

module.exports = {
    id: 'ext-colortheme',
    name: 'New Color Theme',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {

        await askForThemeInfo(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        const nameAnswer = await generator.prompt({
            type: 'input',
            name: 'themeName',
            message: 'What\'s the name of your theme shown to the user?',
            default: extensionConfig.themeName,
            validate: validator.validateNonEmpty
        });
        extensionConfig.themeName = nameAnswer.themeName;

        const themeBase = await generator.prompt({
            type: 'list',
            name: 'themeBase',
            message: 'Select a base theme:',
            choices: [{
                name: "Dark",
                value: "vs-dark"
            },
            {
                name: "Light",
                value: "vs"
            },
            {
                name: "High Contrast",
                value: "hc-black"
            }
            ]
        });
        extensionConfig.themeBase = themeBase.themeBase;


        await prompts.askForGit(generator, extensionConfig);
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        if (extensionConfig.tmThemeFileName) {
            generator.fs.copyTpl(generator.sourceRoot() + '/themes/theme.tmTheme', extensionConfig.name + '/themes/' + extensionConfig.tmThemeFileName, extensionConfig);
        }
        extensionConfig.themeFileName = sanitize(extensionConfig.themeName + '-color-theme.json');
        if (extensionConfig.themeContent) {
            extensionConfig.themeContent.name = extensionConfig.themeName;
            generator.fs.copyTpl(generator.sourceRoot() + '/themes/color-theme.json', extensionConfig.name + '/themes/' + extensionConfig.themeFileName, extensionConfig);
        } else {
            if (extensionConfig.themeBase === 'vs') {
                generator.fs.copyTpl(generator.sourceRoot() + '/themes/new-light-color-theme.json', extensionConfig.name + '/themes/' + extensionConfig.themeFileName, extensionConfig);
            } else if (extensionConfig.themeBase === 'hc') {
                generator.fs.copyTpl(generator.sourceRoot() + '/themes/new-hc-color-theme.json', extensionConfig.name + '/themes/' + extensionConfig.themeFileName, extensionConfig);
            } else {
                generator.fs.copyTpl(generator.sourceRoot() + '/themes/new-dark-color-theme.json', extensionConfig.name + '/themes/' + extensionConfig.themeFileName, extensionConfig);
            }
        }

        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
            generator.fs.copy(generator.sourceRoot() + '/gitattributes', extensionConfig.name + '/.gitattributes');
        }
    }
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
async function askForThemeInfo(generator, extensionConfig) {
    const answer = await generator.prompt({
        type: 'list',
        name: 'themeImportType',
        message: 'Do you want to import or convert an existing TextMate color theme?',
        choices: [
            {
                name: 'No, start fresh',
                value: 'new'
            },
            {
                name: 'Yes, import an existing theme but keep it as tmTheme file.',
                value: 'import-keep'
            },
            {
                name: 'Yes, import an existing theme and inline it in the Visual Studio Code color theme file.',
                value: 'import-inline'
            }
        ]
    });
    let type = answer.themeImportType;
    if (type === 'import-keep' || type === 'import-inline') {
        generator.log("Enter the location (URL (http, https) or file name) of the tmTheme file, e.g., http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme.");
        const urlAnswer = await generator.prompt({
            type: 'input',
            name: 'themeURL',
            message: 'URL or file name to import:'
        });
        await themeConverter.convertTheme(urlAnswer.themeURL, extensionConfig, type === 'import-inline', generator);
    } else {
        await themeConverter.convertTheme(null, extensionConfig, false, generator);
    }

}