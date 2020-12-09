/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

module.exports = {
    id: 'ext-web-update',
    insidersName: 'Add Web bits to existing extension (TypeScript)',
    update: true,
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        const pkgJSON = generator.fs.readJSON(generator.destinationPath('package.json'));
        if (!pkgJSON || !pkgJSON.engines || !pkgJSON.engines.vscode) {
            generator.log('');
            generator.log('Unable to find `package.json` in the current directory.');
            generator.log('Please run the generator on the folder on an existing VSCode extension.');
            throw new Error('No extension detected at ' + generator.destinationPath());
        }
        extensionConfig.pkgJSON = pkgJSON;
    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {

        generator.log('To make this extension a web extension, the generator will add the following:');
        generator.log('- A new main module `src/web/extension.ts` used when running in the web extension host.');
        generator.log('- New webpack configuration file `build/web-extension.webpack.config.js`');
        generator.log('- Updates to `package.json`:');
        generator.log('  - new property `browser`: points to the packaged web main module.');
        generator.log('  - new devDependencies: `webpack`, `webpack-cli` and `ts-loader`');
        generator.log('  - new scripts: `compile-web`, `watch-web` and `package-web`');

        extensionConfig.name = extensionConfig.pkgJSON.name;
        extensionConfig.displayName = extensionConfig.pkgJSON.displayName;

        const dependencyVersions = extensionConfig.dependencyVersions;

        generator.fs.extendJSON('package.json', {
            'browser': './dist/web/extension.js',
            'scripts': {
                "compile-web": "webpack --config ./build/web-extension.webpack.config.js",
                "watch-web": "webpack --watch --config ./build/web-extension.webpack.config.js",
                "package-web": "webpack --mode production --devtool hidden-source-map --config ./build/web-extension.webpack.config.js",
            },
            'devDependencies': {
                'ts-loader': dependencyVersions['ts-loader'],
                'webpack': dependencyVersions['webpack'],
                'webpack-cli': dependencyVersions['webpack-cli']
            }
        });

        generator.fs.copyTpl(generator.sourceRoot() + '/src/web/extension.ts', 'src/web/extension.ts', extensionConfig, {});

        generator.fs.copyTpl(generator.sourceRoot() + '/build/web-extension.webpack.config.js', 'build/web-extension.webpack.config.js', extensionConfig);

        if (generator.fs.exists(generator.destinationPath('yarn.lock'))) {
            extensionConfig.pkgManager = 'yarn';
        } else {
            extensionConfig.pkgManager = 'npm';
        }
        extensionConfig.installDependencies = true;

    }
}
