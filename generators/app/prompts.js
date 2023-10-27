
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import Generator from 'yeoman-generator';

import * as validator from './validator.js';
import * as path from 'path';

/**
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForExtensionDisplayName(generator, extensionConfig) {
    let extensionDisplayName = generator.options['extensionDisplayName'];
    if (extensionDisplayName) {
        extensionConfig.displayName = extensionDisplayName;
        return Promise.resolve();
    }
    const nameFromFolder = generator.options['destination'] ? path.basename(generator.destinationPath()) : '';

    if (generator.options['quick'] && nameFromFolder) {
        extensionConfig.displayName = nameFromFolder;
        return Promise.resolve();
    }

    return generator.prompt({
        type: 'input',
        name: 'displayName',
        message: 'What\'s the name of your extension?',
        default: nameFromFolder
    }).then(displayNameAnswer => {
        extensionConfig.displayName = displayNameAnswer.displayName;
    });
}

/**
 * Ask for extension id ("name" in package.json)
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForExtensionId(generator, extensionConfig) {
    let extensionName = generator.options['extensionId'];
    if (extensionName) {
        extensionConfig.name = extensionName;
        return Promise.resolve();
    }
    let def = extensionConfig.name;
    if (!def && extensionConfig.displayName) {
        def = extensionConfig.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
    if (def && generator.options['quick']) {
        extensionConfig.name = def;
        return Promise.resolve();
    }

    return generator.prompt({
        type: 'input',
        name: 'name',
        message: 'What\'s the identifier of your extension?',
        default: def || '',
        validate: validator.validateExtensionId
    }).then(nameAnswer => {
        extensionConfig.name = nameAnswer.name;
    });
}

/**
 * Ask for extension description
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForExtensionDescription(generator, extensionConfig) {
    let extensionDescription = generator.options['extensionDescription'];
    if (extensionDescription) {
        extensionConfig.description = extensionDescription;
        return Promise.resolve();
    }
    if (generator.options['quick']) {
        extensionConfig.description = '';
        return Promise.resolve();
    }

    return generator.prompt({
        type: 'input',
        name: 'description',
        message: 'What\'s the description of your extension?',
        default: ''
    }).then(descriptionAnswer => {
        extensionConfig.description = descriptionAnswer.description;
    });
}

/**
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForGit(generator, extensionConfig) {
    let gitInit = generator.options['gitInit'];
    if (typeof gitInit === 'boolean') {
        extensionConfig.gitInit = Boolean(gitInit);
        return Promise.resolve();
    }
    if (generator.options['quick']) {
        extensionConfig.gitInit = true;
        return Promise.resolve();
    }

    return generator.prompt({
        type: 'confirm',
        name: 'gitInit',
        message: 'Initialize a git repository?',
        default: true
    }).then(gitAnswer => {
        extensionConfig.gitInit = gitAnswer.gitInit;
    });
}

/**
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForPackageManager(generator, extensionConfig) {
    let pkgManager = generator.options['pkgManager'];
    if (pkgManager === 'npm' || pkgManager === 'yarn' || pkgManager === 'pnpm') {
        extensionConfig.pkgManager = pkgManager;
        return Promise.resolve();
    }

    extensionConfig.pkgManager = 'npm';
    if (generator.options['quick']) {
        return Promise.resolve();
    }


    return generator.prompt({
        type: 'list',
        name: 'pkgManager',
        message: 'Which package manager to use?',
        choices: [
            {
                name: 'npm',
                value: 'npm'
            },
            {
                name: 'yarn',
                value: 'yarn'
            },
            {
                name: 'pnpm',
                value: 'pnpm'
            }
        ]
    }).then(pckgManagerAnswer => {
        extensionConfig.pkgManager = pckgManagerAnswer.pkgManager;
    });
}

/**
* @param {Generator} generator
* @param {Object} extensionConfig
*/
export function askForWebpack(generator, extensionConfig) {
    let webpack = generator.options['webpack'];
    if (typeof webpack === 'boolean') {
        extensionConfig.webpack = Boolean(webpack);
        return Promise.resolve();
    }

    if (generator.options['quick']) {
        extensionConfig.webpack = false;
        return Promise.resolve();
    }

    return generator.prompt({
        type: 'confirm',
        name: 'webpack',
        message: 'Bundle the source code with webpack?',
        default: false
    }).then(gitAnswer => {
        extensionConfig.webpack = gitAnswer.webpack;
    });
}
