var path = require('path');
var assert = require('yeoman-generator').assert;
var helpers = require('yeoman-generator').test;

var env = require('../generators/app/env');

var fs = require('fs');

describe('test theme generator', function () {
    this.timeout(10000);

    it('theme', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeURL: 'http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme',
                name: 'testTheme',
                displayName: 'Test Theme',
                description: 'My TestTheme',
                publisher: 'Microsoft',
                themeName: 'Green',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .on('end', function () {
                var expected = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": env.vsCodeEngine
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
                assert.file(['package.json', 'README.md', 'themes/Monokai.tmTheme', 'vsc-extension-quickstart.md']);

                var body = fs.readFileSync('package.json', 'utf8');

                var actual = JSON.parse(body);
                assert.deepEqual(expected, actual);

                done();
            });
    });

    it('language', function (done) {
        this.timeout(10000);
        
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-language',
                tmLanguageURL: 'http://raw.githubusercontent.com/textmate/ant.tmbundle/master/Syntaxes/Ant.tmLanguage',
                name: 'testLan',
                displayName: 'Test Lan',
                description: 'My TestLan',
                publisher: 'Microsoft',
                languageId: 'ant',
                languageName: 'ANT',
                languageScopeName: 'source.ant',
                languageExtensions: '.ant'
            }) // Mock the prompt answers
            .on('end', function () {
                var expected = {
                    "name": "testLan",
                    "displayName": "Test Lan",
                    "description": "My TestLan",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": env.vsCodeEngine
                    },
                    "categories": [
                        "Languages"
                    ],
                    "contributes": {
                        "languages": [{
                            "id": "ant",
                            "aliases": ["ANT", "ant"],
                            "extensions": [".ant"],
                            "configuration": "./ant.configuration.json"
                        }],
                        "grammars": [{
                            "language": "ant",
                            "scopeName": "text.xml.ant",
                            "path": "./syntaxes/ant.tmLanguage"
                        }]
                    }
                };
                assert.file(['package.json', 'README.md', 'syntaxes/ant.tmLanguage', 'ant.configuration.json', 'vsc-extension-quickstart.md']);

                var body = fs.readFileSync('package.json', 'utf8');

                var actual = JSON.parse(body);
                assert.deepEqual(expected, actual);

                done();
            });
    });


    it('snippet', function (done) {
        this.timeout(10000);
        
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-snippets',
                snippetPath: path.join(__dirname, 'fixtures/tmsnippets'),
                name: 'testSnip',
                displayName: 'Test Snip',
                description: 'My TestSnip',
                publisher: 'Microsoft',
                languageId: 'python'
            }) // Mock the prompt answers
            .on('end', function () {
                var expected = {
                    "name": "testSnip",
                    "displayName": 'Test Snip',
                    "description": "My TestSnip",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": env.vsCodeEngine
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
                assert.file(['package.json', 'README.md', 'snippets/snippets.json', 'vsc-extension-quickstart.md']);

                var body = fs.readFileSync('package.json', 'utf8');

                var actual = JSON.parse(body);
                assert.deepEqual(expected, actual);

                done();
            });
    });

    it('command-ts', function (done) {
        this.timeout(10000);
        
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-ts',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                publisher: 'Microsoft',
                gitInit: false
            }) // Mock the prompt answers
            .on('end', function () {
                var expected = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": env.vsCodeEngine
                    },
                    "activationEvents": [
                        "onCommand:extension.sayHello"
                    ],
                    "devDependencies": {
                        "typescript": "^1.8.5",
                        "vscode": "^0.11.0"
                    },
                    "main": "./out/src/extension",
                    "scripts": {
                        "compile": "node ./node_modules/vscode/bin/compile -watch -p ./",
                        "vscode:prepublish": "node ./node_modules/vscode/bin/compile",
                        "postinstall": "node ./node_modules/vscode/bin/install"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "extension.sayHello",
                            "title": "Hello World"
                        }]
                    }
                };
                assert.file(['package.json', 'README.md', '.vscodeignore', 'src/extension.ts', 'test/extension.test.ts', 'test/index.ts', '.gitignore', 'tsconfig.json']);

                var body = fs.readFileSync('package.json', 'utf8');

                var actual = JSON.parse(body);
                assert.deepEqual(expected, actual);

                done();
            });
    });
});