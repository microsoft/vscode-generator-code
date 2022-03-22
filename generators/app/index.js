/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

const Generator = require('yeoman-generator');
const yosay = require('yosay');

const path = require('path');
const env = require('./env');
const which = require('which');

const colortheme = require('./generate-colortheme');
const commandjs = require('./generate-command-js');
const commandts = require('./generate-command-ts');
const commandweb = require('./generate-command-web');
const extensionpack = require('./generate-extensionpack');
const keymap = require('./generate-keymap');
const language = require('./generate-language');
const localization = require('./generate-localization');
const notebook = require('./generate-notebook-renderer');
const snippets = require('./generate-snippets');

const extensionGenerators = [
    commandts, commandjs, colortheme, language, snippets, keymap, extensionpack, localization,
    commandweb, notebook
]

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.description = 'Generates a Visual Studio Code extension ready for development.';

        this.argument('destination', { type: String, required: false, description: `\n    The folder to create the extension in, absolute or relative to the current working directory.\n    Use '.' for the current folder. If not provided, defaults to a folder with the extension display name.\n  ` })

        this.option('insiders', { type: Boolean, alias: 'i', description: 'Show the insiders options for the generator' });
        this.option('quick', { type: Boolean, alias: 'q', description: 'Quick mode, skip all optional prompts and use defaults' });
        this.option('open', { type: Boolean, alias: 'o', description: 'Open the generated extension in Visual Studio Code' });
        this.option('openInInsiders', { type: Boolean, alias: 'O', description: 'Open the generated extension in Visual Studio Code Insiders' });

        this.option('extensionType', { type: String, alias: 't', description: extensionGenerators.slice(0, 6).map(e => e.aliases[0]).join(', ') + '...' });
        this.option('extensionDisplayName', { type: String, alias: 'n', description: 'Display name of the extension' });
        this.option('extensionId', { type: String, description: 'Id of the extension' });
        this.option('extensionDescription', { type: String, description: 'Description of the extension' });

        this.option('pkgManager', { type: String, description: `'npm' or 'yarn'` });
        this.option('webpack', { type: Boolean, description: `Bundle the extension with webpack` });
        this.option('gitInit', { type: Boolean, description: `Initialize a git repo` });

        this.option('snippetFolder', { type: String, description: `Snippet folder location` });
        this.option('snippetLanguage', { type: String, description: `Snippet language` });

        this.extensionConfig = Object.create(null);
        this.extensionConfig.installDependencies = false;
        this.extensionConfig.insiders = false;

        this.extensionGenerator = undefined;

        this.abort = false;
    }

    async initializing() {
        if (this.options['insiders']) {
            this.extensionConfig.insiders = true;
        }

        // Welcome
        if (!this.extensionConfig.insiders) {
            this.log(yosay('Welcome to the Visual Studio Code Extension generator!'));
        } else {
            this.log(yosay('Welcome to the Visual Studio Code Insiders Extension generator!'));
        }

        const destination = this.options['destination'];
        if (destination) {
            const folderPath = path.resolve(this.destinationPath(), destination);
            this.destinationRoot(folderPath);
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
            const extensionGenerator = extensionGenerators.find(g => g.aliases.indexOf(extensionType) !== -1);
            if (extensionGenerator) {
                this.extensionConfig.type = extensionGenerator.id;
            } else {
                this.log("Invalid extension type: " + extensionType + '\nPossible types are: ' + extensionGenerators.map(g => g.aliases.join(', ')).join(', '));
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
        if (!this.options['destination'] && !this.extensionGenerator.update) {
            this.destinationRoot(this.destinationPath(this.extensionConfig.name))
        }
        this.env.cwd = this.destinationPath();

        this.log();
        this.log(`Writing in ${this.destinationPath()}...`);

        this.sourceRoot(path.join(__dirname, './templates/' + this.extensionConfig.type));

        return this.extensionGenerator.writing(this, this.extensionConfig);
    }

    // Installation
    install() {
        if (this.abort) {
            this.env.options.skipInstall = true;
            return;
        }
        if (this.extensionConfig.installDependencies) {
            this.env.options.nodePackageManager = this.extensionConfig.pkgManager;
        } else {
            this.env.options.skipInstall = true;
        }
    }

    // End
    async end() {
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
            this.spawnCommand('git', ['init', '--quiet', '--initial-branch=main']);
        }

        if (this.extensionConfig.proposedAPI) {
            this.spawnCommand(this.extensionConfig.pkgManager, ['run', 'update-proposed-api']);
        }
        this.log('');

        this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
        this.log('');

        const [codeStableLocation, codeInsidersLocation] = await Promise.all([which('code').catch(() => undefined), which('code-insiders').catch(() => undefined)]);

        if (!this.extensionConfig.insiders && !this.options['open'] && !this.options['openInInsiders'] && !this.options['quick']) {
            const cdLocation = this.options['destination'] || this.extensionConfig.name;

            this.log('To start editing with Visual Studio Code, use the following commands:');
            this.log('');
            if (!this.extensionConfig.insiders) {
                this.log('     code ' + cdLocation);
            } else {
                this.log('     code-insiders ' + cdLocation);
            }
            this.log('');
        }
        this.log('Open vsc-extension-quickstart.md inside the new extension for further instructions');
        this.log('on how to modify, test and publish your extension.');
        this.log('');

        if (this.extensionGenerator.endMessage) {
            this.extensionGenerator.endMessage(this, this.extensionConfig);
        }

        this.log('For more information, also visit http://code.visualstudio.com and follow us @code.');
        this.log('\r\n');

        if (this.options["open"]) {
            if (codeStableLocation) {
                this.log(`Opening ${this.destinationPath()} in Visual Studio Code...`);
                this.spawnCommand(codeStableLocation, [this.destinationPath()]);
            } else {
                this.log(`'code' command not found.`);
            }
        } else if (this.options["openInInsiders"]) {
            if (codeInsidersLocation) {
                this.log(`Opening ${this.destinationPath()} with Visual Studio Code Insiders...`);
                this.spawnCommand(codeInsidersLocation, [this.destinationPath()]);
            } else {
                this.log(`'code-insiders' command not found.`);
            }
        } else if (codeInsidersLocation || codeStableLocation) {
            if (this.options["quick"]) {
                this.spawnCommand(codeInsidersLocation || codeStableLocation, [this.destinationPath()]);
            } else {
                const choices = [];
                if (codeInsidersLocation) {
                    choices.push({ name: "Open with `code-insiders`", value: codeInsidersLocation });
                }
                if (codeStableLocation) {
                    choices.push({ name: "Open with `code`", value: codeStableLocation });
                }
                choices.push({ name: "Skip", value: 'skip' });

                const answer = await this.prompt({
                    type: "list",
                    name: "openWith",
                    message: "Do you want to open the new folder with Visual Studio Code?",
                    choices
                });
                if (answer && answer.openWith && answer.openWith !== 'skip') {
                    this.spawnCommand(answer.openWith, [this.destinationPath()]);
                }
            }
        }
    }
}
