/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

const Generator = require('yeoman-generator');
const yosay = require('yosay');

const path = require('path');
const env = require('./env');

const colortheme = require('./generate-colortheme');
const commandjs = require('./generate-command-js');
const commandts = require('./generate-command-ts ');
const commandweb = require('./generate-command-web');
const extensionpack = require('./generate-extensionpack');
const keymap = require('./generate-keymap');
const language = require('./generate-language');
const localization = require('./generate-localization');
const notebook = require('./generate-notebook-renderer');
const snippets = require('./generate-snippets');
const webupdate = require('./generate-web-update');

const extensionGenerators = [
    commandts, commandjs, colortheme, language, snippets, keymap, extensionpack, localization,
    commandweb, notebook, webupdate
]

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.option('extensionType', { type: String, description: extensionGenerators.map(e => `'${e.id.substr(4)}'`).join(', ') });
        this.option('extensionName', { type: String, description: 'Name of the extension' });
        this.option('extensionDescription', { type: String, description: 'Description of the extension' });
        this.option('extensionDisplayName', { type: String, description: 'Display name of the extension' });

        this.option('pkgManager', { type: String, description: `'npm' or 'yarn'`});
        this.option('webpack', { type: Boolean, description: `Bundle the extension with webpack` });
        this.option('gitInit', { type: Boolean, description: `Initialize a git repo` });

        this.option('snippetFolder', { type: String, description: `Snippet folder location` });
        this.option('snippetLanguage', { type: String, description: `Snippet language` });

        this.option('insiders', { type: Boolean, alias: 'i' , description: `Show the insiders options for the generator`});

        this.extensionConfig = Object.create(null);
        this.extensionConfig.installDependencies = false;

        this.extensionGenerator = undefined;

        this.abort = false;
    }

    async initializing() {
        const cliArgs = this.options['_'];
        this.extensionConfig.insiders = Array.isArray(cliArgs) && cliArgs.indexOf('insiders') !== -1 || !!this.options['insiders'];

        // Welcome
        if (!this.extensionConfig.insiders) {
            this.log(yosay('Welcome to the Visual Studio Code Extension generator!'));
        } else {
            this.log(yosay('Welcome to the Visual Studio Code Insiders Extension generator!'));
        }

        // evaluateEngineVersion
        const dependencyVersions = await env.getDependencyVersions();
        this.extensionConfig.dependencyVersions = dependencyVersions;
        this.extensionConfig.dep = function (name) {
            const version = dependencyVersions[name];
            if (typeof version === 'undefined') {
                throw new Error(`Module ${name} is not listed in env.js`);
            }
            return `${JSON.stringify(name)}: ${JSON.stringify(version)}`;
        };
        this.extensionConfig.vsCodeEngine = await env.getLatestVSCodeVersion();
    }

    async prompting() {

        // Ask for extension type
        const extensionType = this.options['extensionType'];
        if (extensionType) {
            const extensionTypeId = 'ext-' + extensionType;
            if (extensionGenerators.find(g => g.id === extensionTypeId)) {
                this.extensionConfig.type = extensionTypeId;
            } else {
                this.log("Invalid extension type: " + extensionType + '\nPossible types are: ' + extensionGenerators.map(g => g.id.substr(4)).join(', '));
                this.abort = true;
            }
        } else {
            const choices = [];
            for (const g of extensionGenerators) {
                const name = this.extensionConfig.insiders ? g.insidersName : g.name;
                if (name) {
                    choices.push({ name, value: g.id })
                }
            }
            this.extensionConfig.type = (await this.prompt({
                type: 'list',
                name: 'type',
                message: 'What type of extension do you want to create?',
                pageSize: choices.length,
                choices,
            })).type;

        }

        this.extensionGenerator = extensionGenerators.find(g => g.id === this.extensionConfig.type);
        try {
            await this.extensionGenerator.prompting(this, this.extensionConfig);
        } catch (e) {
            this.abort = true;
        }

    }
    // Write files
    writing() {
        if (this.abort) {
            return;
        }
        this.sourceRoot(path.join(__dirname, './templates/' + this.extensionConfig.type));

        return this.extensionGenerator.writing(this, this.extensionConfig);
    }

    // Installation
    install() {
        if (this.abort) {
            return;
        }
        if (!this.extensionGenerator.update) {
            process.chdir(this.extensionConfig.name);
        }
        if (this.extensionConfig.installDependencies) {
            this.installDependencies({
                yarn: this.extensionConfig.pkgManager === 'yarn',
                npm: this.extensionConfig.pkgManager === 'npm',
                bower: false
            });
        }
    }

    // End
    end() {
        if (this.abort) {
            return;
        }

        if (this.extensionGenerator.update) {
            this.log('');
            this.log('Your extension has been updated!');
            this.log('');
            this.log('To start editing with Visual Studio Code, use the following commands:');
            this.log('');
            if (!this.extensionConfig.insiders) {
                this.log('     code .');
            } else {
                this.log('     code-insiders .');
            }
            this.log(`     ${this.extensionConfig.pkgManager} run compile-web`);
            this.log('');
            return;
        }

        // Git init
        if (this.extensionConfig.gitInit) {
            this.spawnCommand('git', ['init', '--quiet']);
        }

        if (this.extensionConfig.proposedAPI) {
            this.spawnCommand(this.extensionConfig.pkgManager, ['run', 'update-proposed-api']);
        }
        this.log('');

        if (!this.extensionConfig.insiders) {
            this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
            this.log('');
            this.log('To start editing with Visual Studio Code, use the following commands:');
            this.log('');
            this.log('     cd ' + this.extensionConfig.name);
            this.log('     code .');
            this.log('');
            this.log('Open vsc-extension-quickstart.md inside the new extension for further instructions');
            this.log('on how to modify, test and publish your extension.');
        } else {
            this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
            this.log('');
            this.log('To start editing with Visual Studio Code, use the following commands:');
            this.log('');
            this.log('     cd ' + this.extensionConfig.name);
            this.log('     code-insiders .');
            this.log('');
            this.log('Open vsc-extension-quickstart.md inside the new extension for further instructions');
            this.log('on how to modify and test your extension.');
        }
        this.log('');

        if (this.extensionGenerator.endMessage) {
            this.extensionGenerator.endMessage(this, this.extensionConfig);
        }

        this.log('For more information, also visit http://code.visualstudio.com and follow us @code.');
        this.log('\r\n');

        if (this.extensionConfig.insiders) {
            this.spawnCommand('code-insiders', [this.destinationPath(this.extensionConfig.name)]);
        }
    }
}
