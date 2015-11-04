'use strict';

var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

var path = require('path');
var fs = require('fs');
var request = require('request');
var plistParser = require('./plistParser');
var snippetConverter = require('./snippetConverter');

module.exports = yeoman.generators.Base.extend({

  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);
    this.argument('extensionType', { type: String, required: false });
    this.argument('extensionName', { type: String, required: false });
    this.argument('extensionParam', { type: String, required: false });
    this.argument('extensionParam2', { type: String, required: false });

    this.extensionConfig = Object.create(null);
    this.extensionConfig.installDependencies = false;
    this.extensionConfig.vsCodeEngine = '^0.10.0';
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
      if (this.extensionType) {
        var extensionTypes = ['colortheme', 'language', 'snippets', 'command-ts', 'command-js'];
        if (extensionTypes.indexOf(this.extensionType) !== -1) {
          this.extensionConfig.type = 'ext-' + this.extensionType;
        } else {
          this.env.error("Invalid extension type: " + this.extensionType + '. Possible types are :' + extensionTypes.join(', '));
        }
        return;
      }

      var done = this.async();
      this.prompt({
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
            name: 'New Language Support',
            value: 'ext-language'
          },
          {
            name: 'New Code Snippets',
            value: 'ext-snippets'
          }
        ]
      }, function (typeAnswer) {
        this.extensionConfig.type = typeAnswer.type;
        done();
      }.bind(this));
    },

    askForThemeInfo: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-colortheme') {
        done();
        return;
      }
      this.extensionConfig.isCustomization = true;

      this.log("URL (http, https) or file name of the tmTheme file, e.g., http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme.")
      this.prompt({
        type: 'input',
        name: 'themeURL',
        message: 'URL or file name:'
      }, function (urlAnswer) {
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

              processContent(this.extensionConfig, fileName, body);
            } else {
              this.env.error("Problems loading theme: " + error);
            }
            done();
          }.bind(this));
        } else {
          // load from disk
          var body = null;
          try {
            body = fs.readFileSync(location);
          } catch (error) {
            this.env.error("Problems loading theme: " + error.message);
          }
          if (body) {
            processContent(this.extensionConfig, path.basename(location), body.toString());
          } else {
            this.env.error("Problems loading theme: Not found");
          }
          done();
        }
      }.bind(this));
    },

    askForLanguageInfo: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-language') {
        done();
        return;
      }

      this.extensionConfig.isCustomization = true;

      this.log("URL (http, https) or file name of the tmLanguage file, e.g., http://raw.githubusercontent.com/textmate/ant.tmbundle/master/Syntaxes/Ant.tmLanguage.");
      this.prompt({
        type: 'input',
        name: 'tmLanguageURL',
        message: 'URL or file:',
      }, function (urlAnswer) {
        var location = urlAnswer.tmLanguageURL;

        function processContent(extensionConfig, fileName, body) {
          var result = plistParser.parse(body);
          if (result.value) {
            var languageInfo = result.value;

            extensionConfig.languageName = languageInfo.name || '';

            // evaluate language id
            var languageId = '';

            if (languageInfo.scopeName) {
              extensionConfig.languageScopeName = languageInfo.scopeName;

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
            extensionConfig.languageId = languageId;
            extensionConfig.name = languageId;

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
              processContent(this.extensionConfig, fileName, body);
            } else {
              this.env.error("Problems loading language definition file: " + error.message);
            }
            done();
          }.bind(this));
        } else {
          // load from disk
          var body = null;
          try {
            body = fs.readFileSync(location);
          } catch (error) {
            this.env.error("Problems loading language definition file: " + error.message);
          }
          if (body) {
            processContent(this.extensionConfig, path.basename(location), body.toString());
          } else {
            this.env.error("Problems loading language definition file: Not found");
          }
          done();
        }
      }.bind(this));
    },

    askForSnippetsInfo: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-snippets') {
        done();
        return;
      }

      this.extensionConfig.isCustomization = true;

      if (this.extensionParam) {
        var count = snippetConverter.processSnippetFolder(this.extensionParam, this);
        if (count <= 0) {
          this.env.error('')
        }
        done();
        return;
      }
      this.log("Folder location that contains Text Mate (.tmSnippet) and Sublime snippets (.sublime-snippet)");

      var snippetPrompt = (function (done) {
        this.prompt({
          type: 'input',
          name: 'snippetPath',
          message: 'Folder name:'
        }, function (snippetAnswer) {
          var count = snippetConverter.processSnippetFolder(snippetAnswer.snippetPath, this);
          if (count < 0) {
            snippetPrompt(done);
          } else {
            done();
          }
        }.bind(this));
      }).bind(this);
      snippetPrompt(done);
    },

    // Ask for extension name
    askForExtensionName: function () {
      if (this.extensionName) {
        this.extensionConfig.name = this.extensionName;
        return;
      }

      var done = this.async();
      this.prompt({
        type: 'input',
        name: 'name',
        message: 'What\'s the name of your extension?',
        default: this.extensionConfig.name
      }, function (nameAnswer) {
        this.extensionConfig.name = nameAnswer.name;
        done();
      }.bind(this));
    },

    // Ask for extension description
    askForExtensionDescription: function () {
      var done = this.async();
      this.prompt({
        type: 'input',
        name: 'description',
        message: 'What\'s the description of your extension?'
      }, function (descriptionAnswer) {
        this.extensionConfig.description = descriptionAnswer.description;
        done();
      }.bind(this));
    },

    // Ask for publisher name
    askForPublisherName: function () {
      var done = this.async();
      this.prompt({
        type: 'input',
        name: 'publisher',
        message: 'What\'s your publisher name?',
        store: true
      }, function (publisherAnswer) {
        this.extensionConfig.publisher = publisherAnswer.publisher;
        done();
      }.bind(this));
    },

    askForLicense: function () {
      var done = this.async();

      this.log('Enter the license under which you want to publish this extension. Use a SPDX license expression syntax string. See https://spdx.org/licenses/ for more information.');
      this.prompt({
        type: 'input',
        name: 'license',
        message: 'License:',
        default: 'ISC'
      }, function (licenseAnswer) {
        this.extensionConfig.license = licenseAnswer.license;
        done();
      }.bind(this));
    },


    askForGit: function () {
      var done = this.async();
      if (['ext-command-ts', 'ext-command-js'].indexOf(this.extensionConfig.type) === -1) {
        done();
        return;
      }

      this.prompt({
        type: 'confirm',
        name: 'gitInit',
        message: 'Initialize a git repository?',
        default: true
      }, function (gitAnswer) {
        this.extensionConfig.gitInit = gitAnswer.gitInit;
        done();
      }.bind(this));
    },

    askForThemeName: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-colortheme') {
        done();
        return;
      }

      this.prompt({
        type: 'input',
        name: 'themeName',
        message: 'What\'s the name of your theme shown to the user?',
        default: this.extensionConfig.themeName,
      }, function (nameAnswer) {
        this.extensionConfig.themeName = nameAnswer.themeName;
        done();
      }.bind(this));
    },

    askForBaseTheme: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-colortheme') {
        done();
        return;
      }

      this.prompt({
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
      }, function (themeBase) {
        this.extensionConfig.themeBase = themeBase.themeBase;
        done();
      }.bind(this));
    },

    askForLanguageId: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-language') {
        done();
        return;
      }

      this.log('Verify the id of the language. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
      this.prompt({
        type: 'input',
        name: 'languageId',
        message: 'Detected languageId:',
        default: this.extensionConfig.languageId,
      }, function (idAnswer) {
        this.extensionConfig.languageId = idAnswer.languageId;
        done();
      }.bind(this));
    },

    askForLanguageName: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-language') {
        done();
        return;
      }

      this.log('Verify the name of the language. The name will be shown in the VS code editor mode selector.');
      this.prompt({
        type: 'input',
        name: 'languageName',
        message: 'Detected name:',
        default: this.extensionConfig.languageName,
      }, function (nameAnswer) {
        this.extensionConfig.languageName = nameAnswer.languageName;
        done();
      }.bind(this));
    },

    askForLanguageExtensions: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-language') {
        done();
        return;
      }

      this.log('Verify the file extensions of the language. Use commas to separate multiple entries (e.g. .ruby, .rb)');
      this.prompt({
        type: 'input',
        name: 'languageExtensions',
        message: 'Detected file extensions:',
        default: this.extensionConfig.languageExtensions.join(', '),
      }, function (extAnswer) {
        this.extensionConfig.languageExtensions = extAnswer.languageExtensions.split(',').map(function (e) { return e.trim(); });
        done();
      }.bind(this));
    },

    askForSnippetLangauge: function () {
      var done = this.async();
      if (this.extensionConfig.type !== 'ext-snippets') {
        done();
        return;
      }

      if (this.extensionParam2) {
        this.extensionConfig.languageId = this.extensionParam2;
        done();
        return;
      }

      this.log('Enter the language for which the snippets should appear. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
      this.prompt({
        type: 'input',
        name: 'languageId',
        message: 'Language id:',
        default: this.extensionConfig.languageId
      }, function (idAnswer) {
        this.extensionConfig.languageId = idAnswer.languageId;
        done();
      }.bind(this));
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

    console.log('publisher: ' + context.publisher);

    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
    this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
    this.template(this.sourceRoot() + '/themes/theme.tmTheme', context.name + '/themes/' + context.themeFileName, context);
  },

  // Write Language Extension
  _writingLanguage: function () {
    var context = this.extensionConfig;

    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
    this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
    this.template(this.sourceRoot() + '/syntaxes/language.tmLanguage', context.name + '/syntaxes/' + context.languageId + '.tmLanguage', context);
  },
  
  // Write Language Extension
  _writingSnippets: function () {
    var context = this.extensionConfig;

    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
    this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
    this.template(this.sourceRoot() + '/snippets/snippets.json', context.name + '/snippets/snippets.json', context);
  }, 
  
  // Write Command Extension (TypeScript)
  _writingCommandTs: function () {
    var context = this.extensionConfig;

    this.directory(this.sourceRoot() + '/.vscode', context.name + '/.vscode');
    this.directory(this.sourceRoot() + '/typings', context.name + '/typings');

    this.copy(this.sourceRoot() + '/.vscodeignore', context.name + '/.vscodeignore');
    this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
    this.copy(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md');
    this.copy(this.sourceRoot() + '/tsconfig.json', context.name + '/tsconfig.json');

    this.template(this.sourceRoot() + '/extension.ts', context.name + '/extension.ts', context);
    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
  
    this.extensionConfig.installDependencies = true;
  },

  // Write Command Extension (JavaScript)
  _writingCommandJs: function () {
    var context = this.extensionConfig;

    this.directory(this.sourceRoot() + '/.vscode', context.name + '/.vscode');
    this.directory(this.sourceRoot() + '/typings', context.name + '/typings');

    this.copy(this.sourceRoot() + '/.vscodeignore', context.name + '/.vscodeignore');
    this.copy(this.sourceRoot() + '/gitignore', context.name + '/.gitignore');
    this.template(this.sourceRoot() + '/README.md', context.name + '/README.md', context);
    this.copy(this.sourceRoot() + '/vsc-extension-quickstart.md', context.name + '/vsc-extension-quickstart.md');
    this.copy(this.sourceRoot() + '/jsconfig.json', context.name + '/jsconfig.json');

    this.template(this.sourceRoot() + '/extension.js', context.name + '/extension.js', context);
    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
  
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
    if (this.extensionConfig.isCustomization) {
      this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
      this.log('');
      this.log('To start using it with Visual Studio Code copy it into the <user home>/.vscode/extensions folder and restart Code.');
    } else {
      this.log('Your extension ' + this.extensionConfig.name + ' has been created!');
      this.log('');
      this.log('To start editing with Visual Studio Code, use the following commands:');
      this.log('');
      this.log('     cd ' + this.extensionConfig.name);
      this.log('     code .');
    }
    this.log('');
    this.log('For more information, visit http://code.visualstudio.com and follow us @code.');
    this.log('\r\n');
  }

});
