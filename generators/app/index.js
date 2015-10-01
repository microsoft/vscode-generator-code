'use strict';

var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');

var path = require('path');
var fs = require('fs');
var request = require('request');
var plistParser = require('./plistParser');

module.exports = yeoman.generators.Base.extend({

  constructor: function () {
    yeoman.generators.Base.apply(this, arguments);

    this.extensionConfig = Object.create(null);
    this.extensionConfig.installDependencies = false;
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
      var done = this.async();
      this.prompt({
        type: 'list',
        name: 'type',
        message: 'What type of extension do you want to create?',
        choices: [
          {
            name: 'New Color Theme',
            value: 'ext-colortheme'
          },
          {
            name: 'New Language Support',
            value: 'ext-language'
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


    // Ask for extension name
    askForExtensionName: function () {
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

    // Ask to init Git - NOT USED currently
    askForGit: function () {
      var done = this.async();
      if (this.extensionConfig.type === 'ext-colortheme' || this.extensionConfig.type === 'ext-language') {
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
    }
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
      default:
        //unknown project type
        break;
    }
  },

  // Write Color Theme Extension
  _writingColorTheme: function () {
    var context = {
      name: this.extensionConfig.name,
      themeName: this.extensionConfig.themeName,
      themeBase: this.extensionConfig.themeBase,
      themeContent: this.extensionConfig.themeContent,
      themeFileName: this.extensionConfig.themeFileName
    };

    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
    //this.directory(this.sourceRoot() + '/.vscode', context.name + '/.vscode');
    this.template(this.sourceRoot() + '/themes/theme.tmTheme', context.name + '/themes/' + context.themeFileName, context);
  },

  // Write Language Extension
  _writingLanguage: function () {
    var context = {
      name: this.extensionConfig.name,
      languageId: this.extensionConfig.languageId,
      languageName: this.extensionConfig.languageName,
      languageExtensions: this.extensionConfig.languageExtensions,
      languageScopeName: this.extensionConfig.languageScopeName,
      languageContent: this.extensionConfig.languageContent
    };

    this.template(this.sourceRoot() + '/package.json', context.name + '/package.json', context);
    //this.directory(this.sourceRoot() + '/.vscode', context.name + '/.vscode');
    this.template(this.sourceRoot() + '/syntaxes/language.tmLanguage', context.name + '/syntaxes/' + context.languageId + '.tmLanguage', context);
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
      this.log('To start using it with Visual Studio Code copy it into the .vscode/extensions folder and restart Code.');
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