/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
import Generator from 'yeoman-generator';
import { Chalk } from 'chalk';
import * as prompts from './prompts.js';

/**
 * @typedef {import('./index.js').ExtensionConfig} ExtensionConfig
 */
const chalk = new Chalk();

/**
 * @type {import('./index.js').ExtensionGenerator}
 */
export default {
    id: 'ext-command-web',
    aliases: ['web', 'command-web'],
    name: 'New Web Extension (TypeScript)',
    /**
     * @param {Generator} generator
     * @param {ExtensionConfig} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await prompts.askForGit(generator, extensionConfig);
        await prompts.askForBundler(generator, extensionConfig, false, 'webpack');
        await prompts.askForPackageManager(generator, extensionConfig);
    },
    /**
     * @param {Generator} generator
     * @param {ExtensionConfig} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        const bundler = extensionConfig.bundler;
        if (bundler === 'esbuild') {
            generator.fs.copy(generator.templatePath('vscode-esbuild'), generator.destinationPath('.vscode'));
        } else {
            generator.fs.copy(generator.templatePath('vscode-webpack'), generator.destinationPath('.vscode'));
        }

        generator.fs.copy(generator.templatePath('.vscodeignore'), generator.destinationPath('.vscodeignore'));
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.templatePath('gitignore'), generator.destinationPath('.gitignore'));
        }
        generator.fs.copyTpl(generator.templatePath('README.md'), generator.destinationPath('README.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('CHANGELOG.md'), generator.destinationPath('CHANGELOG.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('vsc-extension-quickstart.md'), generator.destinationPath('vsc-extension-quickstart.md'), extensionConfig);
        generator.fs.copyTpl(generator.templatePath('tsconfig.json'), generator.destinationPath('tsconfig.json'), extensionConfig);

        generator.fs.copyTpl(generator.templatePath('src/web/extension.ts'), generator.destinationPath('src/web/extension.ts'), extensionConfig);

        generator.fs.copy(generator.templatePath('src/web/test/suite/extension.test.ts'), generator.destinationPath('src/web/test/suite/extension.test.ts'));

        if (bundler === 'esbuild') {
            generator.fs.copyTpl(generator.templatePath('esbuild.js'), generator.destinationPath('esbuild.js'), extensionConfig);
            generator.fs.copyTpl(generator.templatePath('esbuild-package.json'), generator.destinationPath('package.json'), extensionConfig);
            generator.fs.copy(generator.templatePath('src/web/test/suite/esbuild-mochaTestRunner.ts'), generator.destinationPath('src/web/test/suite/mochaTestRunner.ts'));
        } else {
            generator.fs.copyTpl(generator.templatePath('webpack.config.js'), generator.destinationPath('webpack.config.js'), extensionConfig);
            generator.fs.copyTpl(generator.templatePath('webpack-package.json'), generator.destinationPath('package.json'), extensionConfig);
            generator.fs.copy(generator.templatePath('src/web/test/suite/webpack-mochaTestRunner.ts'), generator.destinationPath('src/web/test/suite/index.ts'));
        }

        generator.fs.copy(generator.templatePath('eslint.config.mjs'), generator.destinationPath('eslint.config.mjs'));

        if (extensionConfig.pkgManager === 'yarn') {
            generator.fs.copyTpl(generator.templatePath('.yarnrc'), generator.destinationPath('.yarnrc'), extensionConfig);
        } else if (extensionConfig.pkgManager === 'pnpm') {
            generator.fs.copyTpl(generator.templatePath('.npmrc-pnpm'), generator.destinationPath('.npmrc'), extensionConfig);
        }

        extensionConfig.installDependencies = true;
        extensionConfig.proposedAPI = false;
    },
    /**
     * @param {Generator} generator
     * @param {ExtensionConfig} extensionConfig
     */
    endMessage: (generator, extensionConfig) => {
        if (extensionConfig.bundler === 'webpack') {
            generator.log(chalk.yellow(`To run the extension you need to install the recommended extension 'amodio.tsl-problem-matcher'.`));
            generator.log('');
        } else if (extensionConfig.bundler === 'esbuild') {
            generator.log(chalk.yellow(`To run the extension you need to install the recommended extension 'connor4312.esbuild-problem-matchers'.`));
            generator.log('');
        }
    }
}
