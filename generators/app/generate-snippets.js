/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
let snippetConverter = require('./snippetConverter');

module.exports = {
    id: 'ext-snippets',
    name: 'New Code Snippets',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await askForSnippetsInfo(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await askForSnippetLanguage(generator, extensionConfig);
        await prompts.askForGit(generator, extensionConfig);

    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/snippets/snippets.code-snippets', extensionConfig.name + '/snippets/snippets.code-snippets', extensionConfig);
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
function askForSnippetsInfo(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    let extensionParam = generator.options['extensionParam'];

    if (extensionParam) {
        let count = snippetConverter.processSnippetFolder(extensionParam, generator);
        if (count <= 0) {
            generator.log('')
        }
        return Promise.resolve();
    }
    generator.log("Folder location that contains Text Mate (.tmSnippet) and Sublime snippets (.sublime-snippet) or press ENTER to start with a new snippet file.");

    let snippetPrompt = () => {
        return generator.prompt({
            type: 'input',
            name: 'snippetPath',
            message: 'Folder name for import or none for new:'
        }).then(snippetAnswer => {
            let count = 0;
            let snippetPath = snippetAnswer.snippetPath;

            if (typeof snippetPath === 'string' && snippetPath.length > 0) {
                const count = snippetConverter.processSnippetFolder(snippetPath, generator);
                if (count <= 0) {
                    return snippetPrompt();
                }
            } else {
                extensionConfig.snippets = {};
                extensionConfig.languageId = null;
            }

            if (count < 0) {
                return snippetPrompt();
            }
        });
    };
    return snippetPrompt();
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForSnippetLanguage(generator, extensionConfig) {
    let extensionParam2 = generator.options['extensionParam2'];

    if (extensionParam2) {
        extensionConfig.languageId = extensionParam2;
        return Promise.resolve();
    }

    generator.log('Enter the language for which the snippets should appear. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
    return generator.prompt({
        type: 'input',
        name: 'languageId',
        message: 'Language id:',
        default: extensionConfig.languageId
    }).then(idAnswer => {
        extensionConfig.languageId = idAnswer.languageId;
    });
}