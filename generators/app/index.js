/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

var yeoman = require('yeoman-generator');
var yosay = require('yosay');

var path = require('path');
var fs = require('fs');
var request = require('request');
var plistParser = require('./plistParser');
var validator = require('./validator');
var snippetConverter = require('./snippetConverter');
var env = require('./env');

module.exports = yeoman.Base.extend({

    constructor: function () {
        yeoman.Base.apply(this, arguments);
        this.option('extensionType', { type: String, required: false });
        this.option('extensionName', { type: String, required: false });
        this.option('extensionParam', { type: String, required: false });
        this.option('extensionParam2', { type: String, required: false });

        this.extensionConfig = Object.create(null);
        this.extensionConfig.installDependencies = false;
        this.extensionConfig.vsCodeEngine = env.vsCodeEngine;
    },

    initializing: {

        // Welcome
        welcome: function () {
            this.log(yosay('Welcome to the Visual Studio Code Extension generator!'));
        }
    },

    prompting: {

        // Ask for extension type
        askForType: function () {
            var generator = this;
            if (generator.extensionType) {
                var extensionTypes = ['colortheme', 'language', 'snippets', 'command-ts', 'command-js'];
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
                choices: [
                    {
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
                        name: 'New Language Support (JavaScript)',
                        value: 'ext-language-js'
                    },
                    {
                        name: 'New Language Support (TypeScript)',
                        value: 'ext-language-ts'
                    },
                    {
                        name: 'New Code Snippets',
                        value: 'ext-snippets'
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

            generator.log("URL (http, https) or file name of the tmTheme file, e.g., http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme.")
            return generator.prompt({
                type: 'input',
                name: 'themeURL',
                message: 'URL or file name:'
            }).then(function (urlAnswer) {
                var location = urlAnswer.themeURL;

                function processContent(extensionConfig, fileName, body) {
                    var themeNameMatch = body.match(/<key>name<\/key>\s*<string>([^<]*)/);
                    var themeName = themeNameMatch ? themeNameMatch[1] : '';

                    if (fileName && fileName.indexOf('.tmTheme') === -1) {
                        fileName = fileName + '.tmTheme';
                    }

                    if (!fileName) {
                        fileName = 'theme.tmTheme';
                    }

                    extensionConfig.themeFileName = fileName;
                    extensionConfig.themeContent = body;
                    extensionConfig.themeName = themeName;
                    extensionConfig.name = 'theme-' + themeName.toLowerCase().replace(/[^\w-]/, '');
                };

                if (location.match(/\w*:\/\//)) {
                    // load from url
                    return new Promise(function(resolve, reject) {
                        request(location, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var contentDisposition = response.headers['content-disposition'];
                                var fileName = '';

                                if (contentDisposition) {
                                    var fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
                                    if (fileNameMatch) {
                                        fileName = fileNameMatch[1];
                                    }
                                }
                                if (!fileName) {
                                    var lastSlash = location.lastIndexOf('/');
                                    if (lastSlash) {
                                        fileName = location.substr(lastSlash + 1);
                                    }
                                }

                                processContent(generator.extensionConfig, fileName, body);
                            } else {
                                generator.env.error("Problems loading theme: " + error);
                            }
                            resolve();
                        });
                    });
                } else {
                    // load from disk
                    var body = null;
                    try {
                        body = fs.readFileSync(location);
                    } catch (error) {
                        generator.env.error("Problems loading theme: " + error.message);
                    }
                    if (body) {
                        processContent(generator.extensionConfig, path.basename(location), body.toString());
                    } else {
                        generator.env.error("Problems loading theme: Not found");
                    }
                }
            });
        },

        askForLanguageInfo: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language-js'&& generator.extensionConfig.type !== 'ext-language-ts') {
                return Promise.resolve();
            }

            generator.extensionConfig.isCustomization = true;

            generator.log("URL (http, https) or file name of the tmLanguage file, e.g., http://raw.githubusercontent.com/textmate/ant.tmbundle/master/Syntaxes/Ant.tmLanguage.");
            return generator.prompt({
                type: 'input',
                name: 'tmLanguageURL',
                message: 'URL or file:',
            }).then(function (urlAnswer) {
                var location = urlAnswer.tmLanguageURL;

                function processContent(extensionConfig, fileName, body) {
                    if (body.indexOf('<!DOCTYPE plist') === -1) {
                        generator.env.error("Language definition file does not contain 'DOCTYPE plist'. Make sure the file content is really plist-XML.");
                    }
                    var result = plistParser.parse(body);
                    if (result.value) {
                        var languageInfo = result.value;

                        extensionConfig.languageName = languageInfo.name || '';

                        // evaluate language id
                        var languageId = '';
                        var languageScopeName;

                        if (languageInfo.scopeName) {
                            languageScopeName = languageInfo.scopeName;

                            var lastIndexOfDot = languageInfo.scopeName.lastIndexOf('.');
                            if (lastIndexOfDot) {
                                languageId = languageInfo.scopeName.substring(lastIndexOfDot + 1);
                            }
                        }
                        if (!languageId && fileName) {
                            var lastIndexOfDot2 = fileName.lastIndexOf('.');
                            if (lastIndexOfDot2 && fileName.substring(lastIndexOfDot2 + 1) == 'tmLanguage') {
                                languageId = fileName.substring(0, lastIndexOfDot2);
                            }
                        }
                        if (!languageId && languageInfo.name) {
                            languageId = languageInfo.name.toLowerCase().replace(/[^\w-_]/, '');
                        }
                        if (!fileName) {
                            fileName = languageId + '.tmLanguage';
                        }
                        if (!languageScopeName) {
                            languageScopeName = 'source.' + languageId;
                            generator.log("Grammar does not define the scope name. Setting to '" + languageScopeName + "' instead");
                        }

                        extensionConfig.languageFileName = fileName;
                        extensionConfig.languageId = languageId;
                        extensionConfig.name = languageId;
                        extensionConfig.languageScopeName = languageScopeName;

                        // evaluate file extensions
                        if (Array.isArray(languageInfo.fileTypes)) {
                            extensionConfig.languageExtensions = languageInfo.fileTypes.map(function (ft) { return '.' + ft; });
                        } else {
                            extensionConfig.languageExtensions = languageId ? ['.' + languageId] : [];
                        }
                    } else {
                        extensionConfig.languageId = '';
                        extensionConfig.languageName = '';
                        extensionConfig.languageScopeName = '';
                        extensionConfig.languageExtensions = [];
                    }
                    extensionConfig.languageContent = body;
                };

                if (location.match(/\w*:\/\//)) {
                    // load from url
                    return new Promise(function(resolve, reject) {
                        request(location, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var contentDisposition = response.headers['content-disposition'];
                                var fileName = '';
                                if (contentDisposition) {
                                    var fileNameMatch = contentDisposition.match(/filename="([^"]*)/);
                                    if (fileNameMatch) {
                                        fileName = fileNameMatch[1];
                                    }
                                }
                                processContent(generator.extensionConfig, fileName, body);
                            } else {
                                generator.env.error("Problems loading language definition file: " + error);
                            }
                            resolve();
                        });
                    });
                } else {
                    // load from disk
                    var body = null;
                    try {
                        body = fs.readFileSync(location);
                    } catch (error) {
                        generator.env.error("Problems loading language definition file: " + error.message);
                    }
                    if (body) {
                        processContent(generator.extensionConfig, path.basename(location), body.toString());
                    } else {
                        generator.env.error("Problems loading language definition file: Not found");
                    }
                }
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
            generator.log("Folder location that contains Text Mate (.tmSnippet) and Sublime snippets (.sublime-snippet)");

            var snippetPrompt = function () {
                return generator.prompt({
                    type: 'input',
                    name: 'snippetPath',
                    message: 'Folder name:'
                }).then(function (snippetAnswer) {
                    var count = snippetConverter.processSnippetFolder(snippetAnswer.snippetPath, generator);
                    if (count < 0) {
                        return snippetPrompt();
                    }
                });
            };
            return snippetPrompt();
        },

        // Ask for extension display name ("displayName" in package.json)
        askForExtensionDisplayName: function () {
            var generator = this;
            if (generator.extensionDisplayName) {
                generator.extensionConfig.displayName = generator.extensionDisplayName;
                return;
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
                return;
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
                message: 'What\'s your publisher name?',
                store: true,
                validate: validator.validatePublisher
            }).then(function (publisherAnswer) {
                generator.extensionConfig.publisher = publisherAnswer.publisher;
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
                choices: [
                    {
                        name: "Dark",
                        value: "vs-dark"
                    },
                    {
                        name: "Light",
                        value: "vs"
                    }
                ]
            }).then(function (themeBase) {
                generator.extensionConfig.themeBase = themeBase.themeBase;
            });
        },

        askForLanguageId: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language-js' && generator.extensionConfig.type !== 'ext-language-ts') {
                return Promise.resolve();
            }

            generator.log('Verify the id of the language. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');

            return generator.prompt({
                type: 'input',
                name: 'languageId',
                message: 'Detected languageId:',
                default: generator.extensionConfig.languageId,
            }).then(function (idAnswer) {
                generator.extensionConfig.languageId = idAnswer.languageId;
            });
        },

        askForLanguageName: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language-js' && generator.extensionConfig.type !== 'ext-language-ts') {
                return Promise.resolve();
            }

            generator.log('Verify the name of the language. The name will be shown in the VS code editor mode selector.');
            return generator.prompt({
                type: 'input',
                name: 'languageName',
                message: 'Detected name:',
                default: generator.extensionConfig.languageName,
            }).then(function (nameAnswer) {
                generator.extensionConfig.languageName = nameAnswer.languageName;
            });
        },

        askForLanguageExtensions: function () {
            var generator = this;
            if (generator.extensionConfig.type !== 'ext-language-js' && generator.extensionConfig.type !== 'ext-language-ts') {
                return Promise.resolve();
            }

            generator.log('Verify the file extensions of the language. Use commas to separate multiple entries (e.g. .ruby, .rb)');
            return generator.prompt({
                type: 'input',
                name: 'languageExtensions',
                message: 'Detected file extensions:',
                default: generator.extensionConfig.languageExtensions.join(', '),
            }).then(function (extAnswer) {
                generator.extensionConfig.languageExtensions = extAnswer.languageExtensions.split(',').map(function (e) { return e.trim(); });
            });
        },

        askForSnippetLangauge: function () {
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
            case 'ext-language-js':
            case 'ext-language-ts':
                this._writingLanguage();
                break;
            case 'ext-snippets':
                this._writingSnippets();
                break;
            case 'ext-command-ts':
                this._writingCommandTs();
                break;
            case 'ext-command-js':
                this._writingCommandJs();
                break;
            default:
                //unknown project type
                break;
        }
    },

    // Write Color Theme Extension
    _writingColorTheme: function () {

        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/themes/theme.tmTheme', context.name + '/themes/' + context.themeFileName, context);
    },

    // Write Language Extension
    _writingLanguage: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.template(this.sourceRoot() + '/language-configuration.json', context.name + '/language-configuration.json', context);
        this.template(this.sourceRoot() + '/syntaxes/language.tmLanguage', context.name + '/syntaxes/' + context.languageFileName, context);
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
    },

    // Write Command Extension (TypeScript)
    _writingCommandTs: function () {
        var context = this.extensionConfig;

        this.directory(this.sourceRoot() + '/vscode', context.name + '/.vscode');
        this.directory(this.sourceRoot() + '/test', context.name + '/test');

        this.copy(this.sourceRoot() + '/vscodeignore', context.name + '/.vscodeignore');
        this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
        this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
        this.template(this.sourceRoot() + '/CHANGELOG.md', context.name + '/CHANGELOG.md', context);
        this.template(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md', context);
        this.copy(this.sourceRoot() + '/tsconfig.json', context.name + '/tsconfig.json');

        this.template(this.sourceRoot() + '/src/extension.ts', context.name + '/src/extension.ts', context);
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);

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
        this.copy(this.sourceRoot() + '/jsconfig.json', context.name + '/jsconfig.json');

        this.template(this.sourceRoot() + '/extension.js', context.name + '/extension.js', context);
        this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
        this.template(this.sourceRoot() + '/.eslintrc.json', context.name + '/.eslintrc.json', context);

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
        this.log('For more information, also visit http://code.visualstudio.com and follow us @code.');
        this.log('\r\n');
    }
});
