"use strict";
var path = require('path');
var assert = require('yeoman-assert')
var helpers = require('yeoman-test');

var env = require('../generators/app/env');

var fs = require('fs');

function stripComments(content) {
    /**
    * First capturing group matches double quoted string
    * Second matches single quotes string
    * Third matches block comments
    * Fourth matches line comments
    */
    var regexp = /("(?:[^\\\"]*(?:\\.)?)*")|('(?:[^\\\']*(?:\\.)?)*')|(\/\*(?:\r?\n|.)*?\*\/)|(\/{2,}.*?(?:(?:\r?\n)|$))/g;
    var result = content.replace(regexp, (match, m1, m2, m3, m4) => {
        // Only one of m1, m2, m3, m4 matches
        if (m3) {
            // A block comment. Replace with nothing
            return '';
        } else if (m4) {
            // A line comment. If it ends in \r?\n then keep it.
            var length = m4.length;
            if (length > 2 && m4[length - 1] === '\n') {
                return m4[length - 2] === '\r' ? '\r\n' : '\n';
            } else {
                return '';
            }
        } else {
            // We match a string
            return match;
        }
    });
    return result;
}


describe('test code generator', function () {
    this.timeout(10000);

    var engineVersion;
    before(function () {
        return env.getLatestVSCodeVersion().then(function (version) {
            console.info('    expecting engine version ' + version);
            engineVersion = version;
        });
    });

    it('theme import', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeImportType: 'import-keep',
                themeURL: 'http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme',
                name: 'testTheme',
                displayName: 'Test Theme',
                description: 'My TestTheme',
                publisher: 'Microsoft',
                themeName: 'Green',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Themes"
                    ],
                    "contributes": {
                        "themes": [{
                            "label": "Green",
                            "uiTheme": "vs-dark",
                            "path": "./themes/Green-color-theme.json"
                        }]
                    }
                };
                var expectedColorTheme = {
                    "name": "Green",
                    "colors": {
                        "editor.background": "#272822",
                        "editorCursor.foreground": "#F8F8F0",
                        "editor.foreground": "#F8F8F2",
                        "editor.lineHighlightBackground": "#3E3D32",
                        "editor.selectionBackground": "#49483E",
                        "editorWhitespace.foreground": "#3B3A32"
                    },
                    "tokenColors": "./Monokai.tmTheme"
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'themes/Green-color-theme.json', 'themes/Monokai.tmTheme', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedPackageJSON);

                    body = fs.readFileSync('themes/Green-color-theme.json', 'utf8');

                    actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedColorTheme);

                    done();
                } catch (e) {
                    done(e);
                }

            }, done);
    });

    it('theme import from file', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeImportType: 'import-keep',
                themeURL: path.join(__dirname, 'fixtures/themes/new theme.tmTheme'),
                name: 'testTheme',
                displayName: 'Test Theme',
                description: 'My TestTheme',
                publisher: 'Microsoft',
                themeName: 'Green',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Themes"
                    ],
                    "contributes": {
                        "themes": [{
                            "label": "Green",
                            "uiTheme": "vs-dark",
                            "path": "./themes/Green-color-theme.json"
                        }]
                    }
                };
                var expectedColorTheme = {
                    "name": "Green",
                    "colors": {
                        "editor.background": "#002B36",
                        "editor.foreground": "#839496",
                        "editor.lineHighlightBackground": "#073642",
                        "editor.selectionBackground": "#073642",
                        "editorCursor.foreground": "#819090",
                        "editorWhitespace.foreground": "#073642"
                    },
                    "tokenColors": "./new theme.tmTheme"
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'themes/Green-color-theme.json', 'themes/new theme.tmTheme', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedPackageJSON);

                    body = fs.readFileSync('themes/Green-color-theme.json', 'utf8');

                    actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedColorTheme);

                    done();
                } catch (e) {
                    done(e);
                }

            }, done);
    });

    it('theme import from file - issue 74', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeImportType: 'import-inline',
                themeURL: path.join(__dirname, 'fixtures/themes/theme-74.tmTheme'),
                name: 'theme74',
                displayName: 'Theme 74',
                description: 'Theme SeventyFour',
                publisher: 'Microsoft',
                themeName: 'Theme 74',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expectedPackageJSON = {
                    "name": "theme74",
                    "displayName": "Theme 74",
                    "description": "Theme SeventyFour",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Themes"
                    ],
                    "contributes": {
                        "themes": [{
                            "label": "Theme 74",
                            "uiTheme": "vs-dark",
                            "path": "./themes/Theme 74-color-theme.json"
                        }]
                    }
                };
                var expectedColorTheme = {
                    "name": "Theme 74",
                    "colors": {
                        "editor.background": "#002B36",
                        "editor.foreground": "#839496",
                        "editor.lineHighlightBackground": "#073642",
                        "editor.selectionBackground": "#073642",
                        "editorCursor.foreground": "#819090",
                        "editorWhitespace.foreground": "#073642"
                    },
                    "tokenColors": [
                        {
                            "settings": {
                                "foreground": "#839496",
                                "background": "#002B36"
                            }
                        },
                        {
                            "name": "Classes",
                            "scope": [
                                "support.class",
                                "entity.name.class",
                                "entity.name.type.class",
                                "meta.class"
                            ],
                            "settings": {
                                "foreground": "#C7AF3F"
                            }
                        }]
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'themes/Theme 74-color-theme.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedPackageJSON);

                    body = fs.readFileSync('themes/Theme 74-color-theme.json', 'utf8');

                    actual = JSON.parse(body);
                    assert.deepEqual(actual, expectedColorTheme);

                    done();
                } catch (e) {
                    done(e);
                }

            }, done);
    });


    it('theme new', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeImportType: 'new',
                name: 'testTheme',
                displayName: 'Test Theme',
                description: 'My TestTheme',
                publisher: 'Microsoft',
                themeName: 'Funky',
                themeBase: 'vs',
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Themes"
                    ],
                    "contributes": {
                        "themes": [{
                            "label": "Funky",
                            "uiTheme": "vs",
                            "path": "./themes/Funky-color-theme.json"
                        }]
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'themes/Funky-color-theme.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);

                    assert.deepEqual(actual, expectedPackageJSON);

                    body = fs.readFileSync('themes/Funky-color-theme.json', 'utf8');

                    actual = JSON.parse(body);

                    assert.equal(actual.name, "Funky");
                    assert.equal(actual.colors['editor.background'], "#ffffff");
                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('language import', function (done) {
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
                languageScopeName: 'text.xml.ant',
                languageExtensions: '.ant'
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testLan",
                    "displayName": "Test Lan",
                    "description": "My TestLan",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Languages"
                    ],
                    "contributes": {
                        "languages": [{
                            "id": "ant",
                            "aliases": ["ANT", "ant"],
                            "extensions": [".ant"],
                            "configuration": "./language-configuration.json"
                        }],
                        "grammars": [{
                            "language": "ant",
                            "scopeName": "text.xml.ant",
                            "path": "./syntaxes/ant.tmLanguage"
                        }]
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'syntaxes/ant.tmLanguage', 'language-configuration.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);
                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('language new', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-language',
                tmLanguageURL: '',
                name: 'crusty',
                displayName: 'Crusty',
                description: 'Crusty, the language',
                publisher: 'Microsoft',
                languageId: 'crusty',
                languageName: 'Crusty',
                languageScopeName: 'source.crusty',
                languageExtensions: '.crusty'
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "crusty",
                    "displayName": "Crusty",
                    "description": "Crusty, the language",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Languages"
                    ],
                    "contributes": {
                        "languages": [{
                            "id": "crusty",
                            "aliases": ["Crusty", "crusty"],
                            "extensions": [".crusty"],
                            "configuration": "./language-configuration.json"
                        }],
                        "grammars": [{
                            "language": "crusty",
                            "scopeName": "source.crusty",
                            "path": "./syntaxes/crusty.tmLanguage.json"
                        }]
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'syntaxes/crusty.tmLanguage.json', 'language-configuration.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    var grammar = fs.readFileSync('syntaxes/crusty.tmLanguage.json', 'utf8');

                    var actualGrammar = JSON.parse(grammar);
                    assert.equal("Crusty", actualGrammar.name);
                    assert.equal("source.crusty", actualGrammar.scopeName);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('snippet new', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-snippets',
                snippetPath: '',
                name: 'testSnip',
                displayName: 'Test Snip',
                description: 'My TestSnip',
                publisher: 'Microsoft',
                languageId: 'python'
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testSnip",
                    "displayName": 'Test Snip',
                    "description": "My TestSnip",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
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
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'snippets/snippets.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }

            });
    });

    it('snippet import', function (done) {
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
            .toPromise().then(function () {
                var expected = {
                    "name": "testSnip",
                    "displayName": 'Test Snip',
                    "description": "My TestSnip",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
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
                var expectedSnippet = {
                    "ase": {
                        "prefix": "ase",
                        "body": "self.assertEqual(${1:expected}, ${2:actual}${3:, '${4:message}'})$0",
                        "description": "Assert Equal",
                        "scope": "source.python"
                    },
                    "asne": {
                        "prefix": "asne",
                        "body": "self.assertNotEqual(${1:expected}, ${2:actual}${3:, '${4:message}'})$0",
                        "description": "Assert Not Equal",
                        "scope": "source.python"
                    },
                    "as": {
                        "prefix": "as",
                        "body": "self.assert_(${1:boolean expression}${2:, '${3:message}'})$0",
                        "description": "Assert",
                        "scope": "source.python"
                    },
                    "tab": {
                        "prefix": "tab",
                        "body": "\ttab()",
                        "description": "Tab In Body",
                        "scope": "source.python"
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'snippets/snippets.json', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    var snippet = fs.readFileSync('snippets/snippets.json', 'utf8');

                    var actualSnippet = JSON.parse(snippet);
                    assert.deepEqual(expectedSnippet, actualSnippet);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('keymap new', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-keymap',
                name: 'testKeym',
                displayName: 'Test Keym',
                description: 'My TestKeym',
                publisher: 'Microsoft'
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testKeym",
                    "displayName": 'Test Keym',
                    "description": "My TestKeym",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Keymaps"
                    ],
                    "contributes": {
                        "keybindings": [{
                            "key": "ctrl+.",
                            "command": "workbench.action.showCommands"
                        }]
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }

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
                strictTypeScript: false,
                tslint: false,
                gitInit: false
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:extension.sayHello"
                    ],
                    "devDependencies": {
                        "typescript": "^2.6.1",
                        "vscode": "^1.1.6",
                        "@types/node": "^7.0.43",
                        "@types/mocha": "^2.2.42"
                    },
                    "main": "./out/extension",
                    "scripts": {
                        "vscode:prepublish": "npm run compile",
                        "compile": "tsc -p ./",
                        "watch": "tsc -watch -p ./",
                        "postinstall": "node ./node_modules/vscode/bin/install",
                        "test": "npm run compile && node ./node_modules/vscode/bin/test"
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
                try {


                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', '.vscodeignore', 'src/extension.ts', 'src/test/extension.test.ts', 'src/test/index.ts', '.gitignore', 'tsconfig.json']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('command-ts with tslint', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-ts',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                publisher: 'Microsoft',
                strictTypeScript: false,
                tslint: true,
                gitInit: false
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:extension.sayHello"
                    ],
                    "devDependencies": {
                        "typescript": "^2.6.1",
                        "vscode": "^1.1.6",
                        "tslint": "^5.8.0",
                        "@types/node": "^7.0.43",
                        "@types/mocha": "^2.2.42"
                    },
                    "main": "./out/extension",
                    "scripts": {
                        "vscode:prepublish": "npm run compile",
                        "compile": "tsc -p ./",
                        "watch": "tsc -watch -p ./",
                        "postinstall": "node ./node_modules/vscode/bin/install",
                        "test": "npm run compile && node ./node_modules/vscode/bin/test"
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
                try {


                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', '.vscodeignore', 'src/extension.ts', 'src/test/extension.test.ts', 'src/test/index.ts', '.gitignore', 'tsconfig.json', 'tslint.json', '.vscode/extensions.json']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });
    it('command-ts with strict TS', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-ts',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                publisher: 'Microsoft',
                strictTypeScript: true,
                tslint: false,
                gitInit: false
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "compilerOptions": {
                        "module": "commonjs",
                        "target": "es6",
                        "outDir": "out",
                        "lib": [
                            "es6"
                        ],
                        "sourceMap": true,
                        "rootDir": "src",
                        "strict": true,
                        "noUnusedLocals": true,
                    },
                    "exclude": [
                        "node_modules",
                        ".vscode-test"
                    ]
                };
                try {
                    var body = fs.readFileSync('tsconfig.json', 'utf8');

                    var actual = JSON.parse(stripComments(body));
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('command-js', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-js',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                publisher: 'Microsoft',
                checkJavaScript: false,
                gitInit: false
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:extension.sayHello"
                    ],
                    "devDependencies": {
                        "typescript": "^2.6.1",
                        "vscode": "^1.1.6",
                        "eslint": "^4.11.0",
                        "@types/node": "^7.0.43",
                        "@types/mocha": "^2.2.42"
                    },
                    "main": "./extension",
                    "scripts": {
                        "postinstall": "node ./node_modules/vscode/bin/install",
                        "test": "node ./node_modules/vscode/bin/test"
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
                try {


                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', '.vscodeignore', 'extension.js', 'test/extension.test.js', 'test/index.js', '.gitignore', 'jsconfig.json']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('command-js with check JS', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-js',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                publisher: 'Microsoft',
                checkJavaScript: true,
                gitInit: false
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "compilerOptions": {
                        "module": "commonjs",
                        "target": "es6",
                        "checkJs": true,
                        "lib": [
                            "es6"
                        ]
                    },
                    "exclude": [
                        "node_modules"
                    ]
                };
                try {
                    var body = fs.readFileSync('jsconfig.json', 'utf8');

                    var actual = JSON.parse(stripComments(body));
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });


    it('extension-pack', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                addExtensions: false,
                type: 'ext-extensionpack',
                name: 'testExtensionPack',
                displayName: 'Test Extension Pack',
                description: 'My Test Extension Pack',
                publisher: 'Microsoft'
            }) // Mock the prompt answers
            .toPromise().then(function () {
                var expected = {
                    "name": "testExtensionPack",
                    "displayName": "Test Extension Pack",
                    "description": "My Test Extension Pack",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Extension Packs"
                    ],
                    "extensionDependencies": [
                        "publisher.extensionName"
                    ]
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('language pack', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-localization',
                lpLanguageId: 'ru',
                lpLanguageName: 'Russian',
                lpLocalizedLanguageName: 'русский',
                publisher: 'Microsoft'
            }).toPromise().then(function () {
                var expected = {
                    "name": "vscode-language-pack-ru",
                    "displayName": "Russian Language Pack",
                    "description": "Language pack extension for Russian",
                    "version": "0.0.1",
                    "publisher": 'Microsoft',
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Language Packs"
                    ],
                    "contributes": {
                        "localizations": [{
                            "languageId": "ru",
                            "languageName": "Russian",
                            "localizedLanguageName": "русский"
                        }]
                    },
                    "scripts": {
                        "update": "cd ../vscode && npm run update-localization-extension ru"
                    }
                };
                try {
                    assert.file(['package.json', 'README.md', 'CHANGELOG.md', 'vsc-extension-quickstart.md', '.gitignore', '.vscodeignore']);

                    var body = fs.readFileSync('package.json', 'utf8');

                    var actual = JSON.parse(body);
                    assert.deepEqual(expected, actual);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });
});