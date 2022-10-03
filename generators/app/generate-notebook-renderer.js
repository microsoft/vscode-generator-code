/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");

module.exports = {
    id: 'ext-notebook-renderer',
    aliases: ['notebook'],
    name: 'New Notebook Renderer (TypeScript)',
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

        generator.fs.copy(generator.templatePath('src'), generator.destinationPath('src'));
        generator.fs.copy(generator.templatePath('vscode'), generator.destinationPath('.vscode'));
        generator.fs.copy(generator.templatePath('tsconfig.json'), generator.destinationPath('tsconfig.json'));
        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));
        generator.fs.copy(generator.templatePath('webpack.config.js'), generator.destinationPath('webpack.config.js'));
        generator.fs.copy(generator.templatePath('.eslintrc.json'), generator.destinationPath('.eslintrc.json'));

        generator.fs.copyTpl(generator.templatePath('package.json'), generator.destinationPath('package.json'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('example/notebook.ipynb'), generator.destinationPath('example/notebook.ipynb'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('src/client/index.ts'), generator.destinationPath('src/client/index.ts'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('src/extension/extension.ts'), generator.destinationPath('src/extension/extension.ts'), extensionConfig);

        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
            generator.fs.copy(generator.templatePath('.gitattributes'), generator.destinationPath('.gitattributes'));
        }

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.templatePath('.yarnrc'), generator.destinationPath('.yarnrc'), extensionConfig);
        } else if (extensionConfig.pkgManager === 'pnpm') {
            generator.fs.copyTpl(generator.templatePath('.npmrc-pnpm'), generator.destinationPath('.npmrc'), extensionConfig);
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
            default: 'x-application/custom-json-output',
        },
    ]);

    answers.rendererMimeTypes = answers.rendererMimeTypes.split(/,\s*/g);
    Object.assign(extensionConfig, answers);
}
