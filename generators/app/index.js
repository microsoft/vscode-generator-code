/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

var yeoman = require('yeoman-generator');
var yosay = require('yosay');

var path = require('path');
var validator = require('./validator');
var snippetConverter = require('./snippetConverter');
var themeConverter = require('./themeConverter');
var grammarConverter = require('./grammarConverter');
var env = require('./env');
var childProcess = require('child_process');
var chalk = require('chalk');
var sanitize = require("sanitize-filename");
var localization = require('./localization');

module.exports = yeoman.Base.extend({

    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.option('extensionType', { type: String, required: false });
        this.option('extensionName', { type: String, required: false });
        this.option('extensionDescription', { type: String, required: false });
        this.option('extensionDisplayName', { type: String, required: false });

        this.option('extensionParam', { type: String, required: false });
        this.option('extensionParam2', { type: String, required: false });

        this.extensionConfig = Object.create(null);
        this.extensionConfig.installDependencies = false;
    },

    initializing: {

        // Welcome
        welcome: function () {
            this.log(yosay('Welcome to the Visual Studio Code Extension generator!'));
        },

        evaluateEngineVersion: function () {
            var extensionConfig = this.extensionConfig;
            return env.getLatestVSCodeVersion().then(function (version) { extensionConfig.vsCodeEngine = version; });
        }
    },

    prompting: {

        // Ask for extension type
        askForType: function () {
            var generator = this;
            if (generator.extensionType) {
                var extensionTypes = ['colortheme', 'language', 'snippets', 'command-ts', 'command-js', 'extensionpack'];
                if (extensionTypes.indexOf(generator.extensionType) !== -1) {
                    generator.extensionConfig.type = 'ext-' + generator.extensionType;
                } else {
                    generator.env.error("Invalid extension type: " + generator.extensionType + '. Possible types are :' + extensionTypes.join(', '));
                }
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'list',
                name: 'type',
                message: 'What type of extension do you want to create?',
                choices: [{
                    name: 'New Extension (TypeScript)',
                    value: 'ext-command-ts'
                },
                {
                    name: 'New Extension (JavaScript)',
                    value: 'ext-command-js'
                },
                {
                    name: 'New Color Theme',
                    value: 'ext-colortheme'
                },
                {
                    name: 'New Language Support',
                    value: 'ext-language'
                },
                {
                    name: 'New Code Snippets',
                    value: 'ext-snippets'
                },
                {
                    name: 'New Keymap',
                    value: 'ext-keymap'
                },
                {
                    name: 'New Extension Pack',
                    value: 'ext-extensionpack'
                },
                {
                    name: 'New Language Pack (Localization)',
                    value: 'ext-localization'
                }
                ]
            }).then(function (typeAnswer) {
                generator.extensionConfig.type = typeAnswer.type;
            });
        },

        askForThemeInfo: function () {
            let generator = this;
            if (generator.extensionConfig.type !== 'ext-colortheme') {
                return Promise.resolve();
            }
            generator.extensionConfig.isCustomization = true;
            return generator.prompt({
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
            }).then(function (answer) {
                let inline = true;
                let type = answer.themeImportType;
                if (type === 'import-keep' || type === 'import-inline') {
                    generator.log("Enter the location (URL (http, https) or file name) of the tmTheme file, e.g., http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme.");
                    return generator.prompt({
                        type: 'input',
                        name: 'themeURL',
                        message: 'URL or file name to import:'
                    }).then(function (urlAnswer) {
                        return themeConverter.convertTheme(urlAnswer.themeURL, generator.extensionConfig, type === 'import-inline', generator);
                    });
                } else {
                    return themeConverter.convertTheme(null, generator.extensionConfig, false, generator);
                }
            });
        },

        askForLanguageInfo: function () {
            var generator = this;

            if (generator.extensionConfig.type !== 'ext-language') {
                return Promise.resolve();
            }

            generator.extensionConfig.isCustomization = true;
            generator.log("Enter the URL (http, https) or the file path of the tmLanguage grammar or press ENTER to start with a new grammar.");
            return generator.prompt({
                type: 'input',
                name: 'tmLanguageURL',
                message: 'URL or file to import, or none for new:',
            }).then(function (urlAnswer) {
                return grammarConverter.convertGrammar(urlAnswer.tmLanguageURL, generator.extensionConfig);
            });
        },

        askForSnippetsInfo: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-snippets') {
                return Promise.resolve();
            }

            generator.extensionConfig.isCustomization = true;

            if (generator.extensionParam) {
                var count = snippetConverter.processSnippetFolder(generator.extensionParam, generator);
                if (count <= 0) {
                    generator.env.error('')
                }
                return Promise.resolve();
            }
            generator.log("Folder location that contains Text Mate (.tmSnippet) and Sublime snippets (.sublime-snippet) or press ENTER to start with a new snippet file.");

            var snippetPrompt = function () {
                return generator.prompt({
                    type: 'input',
                    name: 'snippetPath',
                    message: 'Folder name for import or none for new:'
                }).then(function (snippetAnswer) {
                    var count = 0;
                    var snippetPath = snippetAnswer.snippetPath;

                    if (typeof snippetPath === 'string' && snippetPath.length > 0) {
                        snippetConverter.processSnippetFolder(snippetPath, generator);
                    } else {
                        generator.extensionConfig.snippets = {};
                        generator.extensionConfig.languageId = null;
                    }

                    if (count < 0) {
                        return snippetPrompt();
                    }
                });
            };
            return snippetPrompt();
        },

        askForLocalizationLanguageId: function () {
            return localization.askForLanguageId(this);
        },

        askForLocalizationLanguageName: function () {
            return localization.askForLanguageName(this);
        },

        askForLocalizedLocalizationLanguageName: function () {
            return localization.askForLocalizedLanguageName(this);
        },

        askForExtensionPackInfo: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-extensionpack') {
                return Promise.resolve();
            }

            generator.extensionConfig.isCustomization = true;

            return generator.prompt({
                type: 'confirm',
                name: 'addExtensions',
                message: 'Add the currently installed extensions to the extension pack?',
                default: true
            }).then(function (addExtensionsAnswer) {

                generator.extensionConfig.extensionList = ["publisher.extensionName"];

                if (addExtensionsAnswer.addExtensions) {
                    return new Promise(function (resolve, reject) {
                        childProcess.exec('code --list-extensions', function (error, stdout, stderr) {
                            if (error) {
                                generator.env.error("Problems starting Code: " + error);
                            } else {
                                var out = stdout.trim();
                                if (out.length > 0) {
                                    generator.extensionConfig.extensionList = out.split(/\s/);
                                }
                            }
                            resolve();
                        });
                    });
                }
            });
        },

        // Ask for extension display name ("displayName" in package.json)
        askForExtensionDisplayName: function () {
            var generator = this;
            if (generator.extensionDisplayName) {
                generator.extensionConfig.displayName = generator.extensionDisplayName;
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'input',
                name: 'displayName',
                message: 'What\'s the name of your extension?',
                default: generator.extensionConfig.displayName
            }).then(function (displayNameAnswer) {
                generator.extensionConfig.displayName = displayNameAnswer.displayName;
            });
        },

        // Ask for extension id ("name" in package.json)
        askForExtensionId: function () {
            var generator = this;
            if (generator.extensionName) {
                generator.extensionConfig.name = generator.extensionName;
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'input',
                name: 'name',
                message: 'What\'s the identifier of your extension?',
                default: generator.extensionConfig.name || generator.extensionConfig.displayName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                validate: validator.validateExtensionId
            }).then(function (nameAnswer) {
                generator.extensionConfig.name = nameAnswer.name;
            });
        },

        // Ask for extension description
        askForExtensionDescription: function () {
            var generator = this;
            if (generator.extensionDescription) {
                generator.extensionConfig.description = generator.extensionDescription;
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'input',
                name: 'description',
                message: 'What\'s the description of your extension?'
            }).then(function (descriptionAnswer) {
                generator.extensionConfig.description = descriptionAnswer.description;
            });
        },

        // Ask for publisher name
        askForPublisherName: function () {
            var generator = this;
            return generator.prompt({
                type: 'input',
                name: 'publisher',
                message: 'What\'s your publisher name (more info: https://code.visualstudio.com/docs/tools/vscecli#_publishing-extensions)?',
                store: true,
                validate: validator.validatePublisher
            }).then(function (publisherAnswer) {
                generator.extensionConfig.publisher = publisherAnswer.publisher;
            });
        },

        askForTypeScriptInfo: function () {
            let generator = this;
            if (generator.extensionConfig.type !== 'ext-command-ts') {
                return Promise.resolve();
            }
            generator.extensionConfig.strictTypeScript = false;
            return generator.prompt({
                type: 'confirm',
                name: 'strictTypeScript',
                message: 'Enable stricter TypeScript checking in \'tsconfig.json\'?',
                default: true
            }).then(function (strictTypeScriptAnswer) {
                generator.extensionConfig.strictTypeScript = strictTypeScriptAnswer.strictTypeScript;
            });
        },

        askForTsLint: function () {
            let generator = this;
            if (generator.extensionConfig.type !== 'ext-command-ts') {
                return Promise.resolve();
            }
            generator.extensionConfig.tslint = false;
            return generator.prompt({
                type: 'confirm',
                name: 'tslint',
                message: 'Setup linting using \'tslint\'?',
                default: true
            }).then(function (tslintAnswer) {
                generator.extensionConfig.tslint = tslintAnswer.tslint;
            });
        },

        askForJavaScriptInfo: function () {
            let generator = this;
            if (generator.extensionConfig.type !== 'ext-command-js') {
                return Promise.resolve();
            }
            generator.extensionConfig.checkJavaScript = false;
            return generator.prompt({
                type: 'confirm',
                name: 'checkJavaScript',
                message: 'Enable JavaScript type checking in \'jsconfig.json\'?',
                default: false
            }).then(function (strictJavaScriptAnswer) {
                generator.extensionConfig.checkJavaScript = strictJavaScriptAnswer.checkJavaScript;
            });
        },

        askForGit: function () {
            var generator = this;
            if (['ext-command-ts', 'ext-command-js'].indexOf(generator.extensionConfig.type) === -1) {
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'confirm',
                name: 'gitInit',
                message: 'Initialize a git repository?',
                default: true
            }).then(function (gitAnswer) {
                generator.extensionConfig.gitInit = gitAnswer.gitInit;
            });
        },

        askForThemeName: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-colortheme') {
                return Promise.resolve();
            }

            return generator.prompt({
                type: 'input',
                name: 'themeName',
                message: 'What\'s the name of your theme shown to the user?',
                default: generator.extensionConfig.themeName,
                validate: validator.validateNonEmpty
            }).then(function (nameAnswer) {
                generator.extensionConfig.themeName = nameAnswer.themeName;
            });
        },

        askForBaseTheme: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-colortheme') {
                return Promise.resolve();
            }

            return generator.prompt({
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
            }).then(function (themeBase) {
                generator.extensionConfig.themeBase = themeBase.themeBase;
            });
        },

        askForLanguageId: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language') {
                return Promise.resolve();
            }

            generator.log('Enter the id of the language. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
            return generator.prompt({
                type: 'input',
                name: 'languageId',
                message: 'Language id:',
                default: generator.extensionConfig.languageId,
            }).then(function (idAnswer) {
                generator.extensionConfig.languageId = idAnswer.languageId;
            });
        },

        askForLanguageName: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language') {
                return Promise.resolve();
            }

            generator.log('Enter the name of the language. The name will be shown in the VS Code editor mode selector.');
            return generator.prompt({
                type: 'input',
                name: 'languageName',
                message: 'Language name:',
                default: generator.extensionConfig.languageName,
            }).then(function (nameAnswer) {
                generator.extensionConfig.languageName = nameAnswer.languageName;
            });
        },

        askForLanguageExtensions: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language') {
                return Promise.resolve();
            }

            generator.log('Enter the file extensions of the language. Use commas to separate multiple entries (e.g. .ruby, .rb)');
            return generator.prompt({
                type: 'input',
                name: 'languageExtensions',
                message: 'File extensions:',
                default: generator.extensionConfig.languageExtensions.join(', '),
            }).then(function (extAnswer) {
                generator.extensionConfig.languageExtensions = extAnswer.languageExtensions.split(',').map(function (e) { return e.trim(); });
            });
        },

        askForLanguageScopeName: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language') {
                return Promise.resolve();
            }
            generator.log('Enter the root scope name of the grammar (e.g. source.ruby)');
            return generator.prompt({
                type: 'input',
                name: 'languageScopeName',
                message: 'Scope names:',
                default: generator.extensionConfig.languageScopeName,
            }).then(function (extAnswer) {
                generator.extensionConfig.languageScopeName = extAnswer.languageScopeName;
            });
        },

        askForSnippetLanguage: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-snippets') {
                return Promise.resolve();
            }

            if (generator.extensionParam2) {
                generator.extensionConfig.languageId = generator.extensionParam2;
                return Promise.resolve();
            }

            generator.log('Enter the language for which the snippets should appear. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
            return generator.prompt({
                type: 'input',
                name: 'languageId',
                message: 'Language id:',
                default: generator.extensionConfig.languageId
            }).then(function (idAnswer) {
                generator.extensionConfig.languageId = idAnswer.languageId;
            });
        },
    },

    // Write files
    writing: function () {
        this.sourceRoot(path.join(__dirname, './templates/' + this.extensionConfig.type));

        switch (this.extensionConfig.type) {
            case 'ext-colortheme':
                this._writingColorTheme();
                break;
            case 'ext-language':
                this._writingLanguage();
                break;
            case 'ext-snippets':
                this._writingSnippets();
                break;
            case 'ext-keymap':
                this._writingKeymaps();
                break;
            case 'ext-command-ts':
                this._writingCommandTs();
                break;
            case 'ext-command-js':
                this._writingCommandJs();
                break;
            case 'ext-extensionpack':
                this._writingExtensionPack();
                break;
            case 'ext-localization':
                localization.writingLocalizationExtension(this);
                break;
            default:
                //unknown project type
                break;
        }
    },

    // Write Color Theme Extension
    _writingExtensionPack: function () {

        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    },

    // Write Color Theme Extension
    _writingColorTheme: function () {

        var context = this.extensionConfig;
        if (context.tmThemeFileName) {
            this.template(this.sourceRoot() + '/themes/theme.tmTheme', context.name + '/themes/' + context.tmThemeFileName, context);
        }
        context.themeFileName = sanitize(context.themeName + '-color-theme.json');
        if (context.themeContent) {
            context.themeContent.name = context.themeName;
            this.template(this.sourceRoot() + '/themes/color-theme.json', context.name + '/themes/' + context.themeFileName, context);
        } else {
            if (context.themeBase === 'vs') {
                this.template(this.sourceRoot() + '/themes/new-light-color-theme.json', context.name + '/themes/' + context.themeFileName, context);
            } else if (context.themeBase === 'hc') {
                this.template(this.sourceRoot() + '/themes/new-hc-color-theme.json', context.name + '/themes/' + context.themeFileName, context);
            } else {
                this.template(this.sourceRoot() + '/themes/new-dark-color-theme.json', context.name + '/themes/' + context.themeFileName, context);
            }
        }

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    },

    // Write Language Extension
    _writingLanguage: function () {
        var context = this.extensionConfig;
        if (!context.languageContent) {
            context.languageFileName = sanitize(context.languageId + '.tmLanguage.json');

            this.template(this.sourceRoot() + '/syntaxes/new.tmLanguage.json', context.name + '/syntaxes/' + context.languageFileName, context);
        } else {
            this.template(this.sourceRoot() + '/syntaxes/language.tmLanguage', context.name + '/syntaxes/' + sanitize(context.languageFileName), context);
        }

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/language-configuration.json', context.name + '/language-configuration.json', context);
        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    },

    // Write Snippets Extension
    _writingSnippets: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/snippets/snippets.json', context.name + '/snippets/snippets.json', context);
        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    },

    // Write Snippets Extension
    _writingKeymaps: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    },

    // Write Command Extension (TypeScript)
    _writingCommandTs: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.directory(this.sourceRoot() + '/src/test', context.name + '/src/test');

        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/tsconfig.json', context.name + '/tsconfig.json', context);

        this.template(this.sourceRoot() + '/src/extension.ts', context.name + '/src/extension.ts', context);
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);

        if (this.extensionConfig.tslint) {
            this.copy(this.sourceRoot() + '/tslint.json', context.name + '/tslint.json');
            this.copy(this.sourceRoot() + '/optional/extensions.json', context.name + '/.vscode/extensions.json');
        }
        this.extensionConfig.installDependencies = true;
    },

    // Write Command Extension (JavaScript)
    _writingCommandJs: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.directory(this.sourceRoot() + '/test', context.name + '/test');

        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/jsconfig.json', context.name + '/jsconfig.json', context);

        this.template(this.sourceRoot() + '/extension.js', context.name + '/extension.js', context);
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/.eslintrc.json', context.name + '/.eslintrc.json', context);

        this.copy(this.sourceRoot() + '/optional/extensions.json', context.name + '/.vscode/extensions.json');

        this.extensionConfig.installDependencies = true;
    },

    // Installation
    install: function () {
        process.chdir(this.extensionConfig.name);

        if (this.extensionConfig.installDependencies) {
            this.installDependencies({
                npm: true,
                bower: false
            });
        }
    },

    // End
    end: function () {

        // Git init
        if (this.extensionConfig.gitInit) {
            this.spawnCommand('git', ['init', '--quiet']);
        }

        this.log('');
        this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
        this.log('');
        this.log('To start editing with Visual Studio Code, use the following commands:');
        this.log('');
        this.log('     cd ' + this.extensionConfig.name);
        this.log('     code .');
        this.log('');
        this.log('Open vsc-extension-quickstart.md inside the new extension for further instructions');
        this.log('on how to modify, test and publish your extension.');
        this.log('');

        if (this.extensionConfig.type === 'ext-extensionpack') {
            this.log(chalk.default.yellow('Please review the "extensionDependencies" in the "package.json" before publishing the extension pack.'));
            this.log('');
        }

        this.log('For more information, also visit http://code.visualstudio.com and follow us @code.');
        this.log('\r\n');
    }
});