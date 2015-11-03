var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

var fs = require('fs');

describe('test theme generator', function () {

  it('theme', function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        type: 'ext-colortheme',
        themeURL: 'http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme',
        name: 'testTheme',
        description: 'My TestTheme',
        publisher: 'Microsoft',
        license: 'MIT',
        themeName: 'Green',
        themeBase: 'vs-dark',
      }) // Mock the prompt answers
      .on('end', function () {
        var expected = {
          "name": "testTheme",
          "description": "My TestTheme",
          "version": "0.0.1",
          "publisher": 'Microsoft',
          "license": "MIT",
          "engines": {
            "vscode": "^0.10.0"
          },
          "categories": [
            "Themes"
          ],
          "contributes": {
            "themes": [
              {
                "label": "Green",
                "uiTheme": "vs-dark",
                "path": "./themes/Monokai.tmTheme"
              }
            ]
          }
        };
        assert.file(['package.json', 'README.md', 'themes/Monokai.tmTheme']);
        
        var body = fs.readFileSync('package.json', 'utf8');

        var actual = JSON.parse(body);
        assert.deepEqual(expected, actual);

        done();
      });
  });
  
  it('language', function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        type: 'ext-language',
        tmLanguageURL: 'http://raw.githubusercontent.com/textmate/ant.tmbundle/master/Syntaxes/Ant.tmLanguage',
        name: 'testLan',
        description: 'My TestLan',
        publisher: 'Microsoft',
        license: 'ISC',
        languageId: 'ant',
        languageName: 'ANT',
        languageScopeName: 'source.ant',
        languageExtensions: '.ant'
      }) // Mock the prompt answers
      .on('end', function () {
        var expected = {
          "name": "testLan",
          "description": "My TestLan",
          "version": "0.0.1",
          "publisher": 'Microsoft',
          "license": "ISC",
          "engines": {
            "vscode": "^0.10.0"
          },
          "categories": [
            "Languages"
          ],
          "contributes": {
            "languages": [{
              "id": "ant",
              "aliases": ["ANT", "ant"],
              "extensions": [".ant"]
            }],
            "grammars": [{
              "language": "ant",
              "scopeName": "text.xml.ant",
              "path": "./syntaxes/ant.tmLanguage"
            }]
          }
        };
        assert.file(['package.json', 'README.md', 'syntaxes/ant.tmLanguage']);
        
        var body = fs.readFileSync('package.json', 'utf8');

        var actual = JSON.parse(body);
        assert.deepEqual(expected, actual);

        done();
      });
  });
  
  
 it('snippet', function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        type: 'ext-snippets',
        snippetPath: path.join(__dirname, 'fixtures/tmsnippets'),
        name: 'testSnip',
        description: 'My TestSnip',
        publisher: 'Microsoft',
        license: 'ISC',
        languageId: 'python'
      }) // Mock the prompt answers
      .on('end', function () {
        var expected = {
          "name": "testSnip",
          "description": "My TestSnip",
          "version": "0.0.1",
          "publisher": 'Microsoft',
          "license": "ISC",
          "engines": {
            "vscode": "^0.10.0"
          },
          "categories": [
            "Snippets"
          ],
          "contributes": {
            "snippets": [{
              "language": "python",
              "path": "./snippets/snippets.json"
            }]
          }
        };
        assert.file(['package.json', 'README.md', 'snippets/snippets.json']);
        
        var body = fs.readFileSync('package.json', 'utf8');

        var actual = JSON.parse(body);
        assert.deepEqual(expected, actual);

        done();
      });
  });
  
 it('command-ts', function (done) {
    helpers.run(path.join(__dirname, '../generators/app'))
      .withPrompts({
        type: 'ext-command-ts',
        name: 'testCom',
        description: 'My TestCom',
        publisher: 'Microsoft',
        license: 'ISC',
        gitInit: false
      }) // Mock the prompt answers
      .on('end', function () {
        var expected = {
          "name": "testCom",
          "description": "My TestCom",
          "version": "0.0.1",
          "publisher": 'Microsoft',
          "license": "ISC",
          "engines": {
            "vscode": "^0.10.0"
          },
          "activationEvents": [
            "onCommand:extension.sayHello"
          ],
          "devDependencies": {
           "vscode": "*"
          },
          "main": "./out/extension",
          "scripts": {
            "compile": "node ./node_modules/vscode/bin/compile -watch -p ./",
           "vscode:prepublish": "node ./node_modules/vscode/bin/compile"
          },

          "categories": [
            "Others"
          ],
          "contributes": {
            "commands": [{
              "command": "extension.sayHello",
              "title": "Hello World"

            }]
          }
        };
        assert.file(['package.json', 'README.md', '.vscodeignore', 'extension.ts', '.gitignore', 'tsconfig.json']);
        
        var body = fs.readFileSync('package.json', 'utf8');

        var actual = JSON.parse(body);
        assert.deepEqual(expected, actual);

        done();
      });
  });   
});