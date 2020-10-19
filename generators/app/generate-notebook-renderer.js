/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-notebook-renderer',
    insidersName: 'New Notebook Renderer (TypeScript)',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await askForNotebookRendererInfo(generator, extensionConfig);

        await prompts.askForGit(generator, extensionConfig);
        await prompts.askForPackageManager(generator, extensionConfig);

    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {

        generator.fs.copy(generator.sourceRoot() + '/src', extensionConfig.name + '/src');
        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copy(generator.sourceRoot() + '/tsconfig.json', extensionConfig.name + '/tsconfig.json');
        generator.fs.copy(generator.sourceRoot() + '/.vscodeignore', extensionConfig.name + '/.vscodeignore');
        generator.fs.copy(generator.sourceRoot() + '/webpack.config.js', extensionConfig.name + '/webpack.config.js');
        generator.fs.copy(generator.sourceRoot() + '/.eslintrc.json', extensionConfig.name + '/.eslintrc.json');
        generator.fs.copy(generator.sourceRoot() + '/src/extension/types/.gitkeep', extensionConfig.name + '/src/extension/types/.gitkeep');
        generator.fs.copy(generator.sourceRoot() + '/src/extension/types/.gitkeep', extensionConfig.name + '/src/test/types/.gitkeep');

        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/src/client/index.ts', extensionConfig.name + '/src/client/index.ts', extensionConfig);

        generator.fs.copyTpl(generator.sourceRoot() + '/src/extension/extension.ts', extensionConfig.name + '/src/extension/extension.ts', extensionConfig);

        if (!extensionConfig.includeContentProvider) {
            generator.fs.delete(extensionConfig.name + '/src/extension/testProvider.ts');
        } else {
            generator.fs.copyTpl(generator.sourceRoot() + '/src/extension/testProvider.ts', extensionConfig.name + '/src/extension/testProvider.ts', extensionConfig);
        }

        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
            generator.fs.copy(generator.sourceRoot() + '/gitattributes', extensionConfig.name + '/.gitattributes');
        }

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.sourceRoot() + '/.yarnrc', extensionConfig.name + '/.yarnrc', extensionConfig);
        }

        extensionConfig.installDependencies = true;
    }
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
async function askForNotebookRendererInfo(generator, extensionConfig) {
    const answers = await generator.prompt([
        {
            type: 'input',
            name: 'rendererId',
            message: 'What\'s the ID for your renderer?',
            default: extensionConfig.name
        },
        {
            type: 'input',
            name: 'rendererDisplayName',
            message: 'What\'s your renderer display name?',
            default: extensionConfig.displayName
        },
        {
            type: 'input',
            name: 'rendererMimeTypes',
            message: 'What mime types will your renderer handle? (separate multiple by commas)',
            default: 'application/json',
        },
        {
            type: 'confirm',
            name: 'includeContentProvider',
            message: 'Should we generate a test notebook content provider and kernel?',
            default: false,
        },
        {
            type: 'input',
            name: 'contentProviderFileType',
            message: 'What the file extension should the content provider handle?',
            default: '.sample-json-notebook',
            // @ts-ignore
            when: answers => answers.includeContentProvider,
            validate: answer => answer.startsWith('.') ? true : 'Extension should be given in the form ".ext"',
        },
    ]);

    answers.rendererMimeTypes = answers.rendererMimeTypes.split(/,\s*/g);
    Object.assign(extensionConfig, answers);
}