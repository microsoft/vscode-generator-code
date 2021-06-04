"use strict";
const path = require('path');
const helpers = require('yeoman-test');

const env = require('../generators/app/env');

function stripComments(content) {
    /**
    * First capturing group matches double quoted string
    * Second matches single quotes string
    * Third matches block comments
    * Fourth matches line comments
    */
    const regexp = /("(?:[^\\\"]*(?:\\.)?)*")|('(?:[^\\\']*(?:\\.)?)*')|(\/\*(?:\r?\n|.)*?\*\/)|(\/{2,}.*?(?:(?:\r?\n)|$))/g;
    const result = content.replace(regexp, (match, m1, m2, m3, m4) => {
        // Only one of m1, m2, m3, m4 matches
        if (m3) {
            // A block comment. Replace with nothing
            return '';
        } else if (m4) {
            // A line comment. If it ends in \r?\n then keep it.
            const length = m4.length;
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

    let engineVersion;
    let dependencyVersions;

    before(async function () {
        engineVersion = await env.getLatestVSCodeVersion();
        console.info('    expecting engine version ' + engineVersion);

        dependencyVersions = await env.getDependencyVersions();
    });

    function devDependencies(names) {
        const res = {};
        for (const name of names) {
            res[name] = dependencyVersions[name];
        }
        return res;
    }


    const standartFiles = ['package.json', 'README.md', 'CHANGELOG.md', '.vscodeignore']

    /**
     * @param {helpers.RunResult} runResult
     * @param {String} extensionName
     * @param {String[]} expectedFileNames
     */
    function assertFiles(runResult, extensionName, expectedFileNames) {
        const allFileNames = expectedFileNames.concat(standartFiles).map(fileName => `${extensionName}/${fileName}`);

        runResult.assertFile(allFileNames);
    }

    it('theme import', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-colortheme',
                themeImportType: 'import-keep',
                themeURL: 'http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme',
                name: 'testTheme',
                displayName: 'Test Theme',
                description: 'My TestTheme',
                themeName: 'Green',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
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
                const expectedColorTheme = {
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
                    assertFiles(runResults, 'testTheme', ['themes/Green-color-theme.json', 'themes/Monokai.tmTheme']);

                    runResults.assertJsonFileContent('testTheme/package.json', expectedPackageJSON);
                    runResults.assertJsonFileContent('testTheme/themes/Green-color-theme.json', expectedColorTheme);

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
                themeName: 'Green',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
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
                const expectedColorTheme = {
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
                    assertFiles(runResults, 'testTheme', ['themes/Green-color-theme.json', 'themes/new theme.tmTheme']);

                    runResults.assertJsonFileContent('testTheme/package.json', expectedPackageJSON);
                    runResults.assertJsonFileContent('testTheme/themes/Green-color-theme.json', expectedColorTheme);

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
                themeName: 'Theme 74',
                themeBase: 'vs-dark',
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "theme74",
                    "displayName": "Theme 74",
                    "description": "Theme SeventyFour",
                    "version": "0.0.1",
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
                const expectedColorTheme = {
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
                    assertFiles(runResults, 'theme74', ['themes/Theme 74-color-theme.json']);

                    runResults.assertJsonFileContent('theme74/package.json', expectedPackageJSON);
                    runResults.assertJsonFileContent('theme74/themes/Theme 74-color-theme.json', expectedColorTheme);

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
                themeName: 'Funky',
                themeBase: 'vs',
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testTheme",
                    "displayName": "Test Theme",
                    "description": "My TestTheme",
                    "version": "0.0.1",
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
                    assertFiles(runResults, 'testTheme', ['themes/Funky-color-theme.json']);

                    runResults.assertJsonFileContent('testTheme/package.json', expectedPackageJSON);
                    runResults.assertJsonFileContent('testTheme/themes/Funky-color-theme.json', { name: 'Funky', colors: { 'editor.background': "#f5f5f5" } });
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
                languageId: 'ant',
                languageName: 'ANT',
                languageScopeName: 'text.xml.ant',
                languageExtensions: '.ant'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testLan",
                    "displayName": "Test Lan",
                    "description": "My TestLan",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Programming Languages"
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
                    assertFiles(runResults, 'testLan', ['syntaxes/ant.tmLanguage']);

                    runResults.assertJsonFileContent('testLan/package.json', expectedPackageJSON);
                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('language import 2', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-language',
                tmLanguageURL: path.join(__dirname, 'fixtures/grammars/foo.tmLanguage.json'),
                name: 'testFooLan',
                displayName: 'Test Foo Lan',
                description: 'My TestFooLan',
                languageId: 'foo',
                languageName: 'FOO',
                languageScopeName: 'source.foo',
                languageExtensions: '.foo'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testFooLan",
                    "displayName": "Test Foo Lan",
                    "description": "My TestFooLan",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Programming Languages"
                    ],
                    "contributes": {
                        "languages": [{
                            "id": "foo",
                            "aliases": ["FOO", "foo"],
                            "extensions": [".foo"],
                            "configuration": "./language-configuration.json"
                        }],
                        "grammars": [{
                            "language": "foo",
                            "scopeName": "source.foo",
                            "path": "./syntaxes/foo.tmLanguage.json"
                        }]
                    }
                };
                try {
                    assertFiles(runResults, 'testFooLan', ['syntaxes/foo.tmLanguage.json', 'language-configuration.json']);

                    runResults.assertJsonFileContent('testFooLan/package.json', expectedPackageJSON);
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
                languageId: 'crusty',
                languageName: 'Crusty',
                languageScopeName: 'source.crusty',
                languageExtensions: '.crusty'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "crusty",
                    "displayName": "Crusty",
                    "description": "Crusty, the language",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Programming Languages"
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
                    assertFiles(runResults, 'crusty', ['syntaxes/crusty.tmLanguage.json', 'language-configuration.json']);

                    runResults.assertJsonFileContent('crusty/package.json', expectedPackageJSON);

                    runResults.assertJsonFileContent('crusty/syntaxes/crusty.tmLanguage.json', {
                        name: 'Crusty',
                        scopeName: 'source.crusty'
                    });

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
                languageId: 'python'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testSnip",
                    "displayName": 'Test Snip',
                    "description": "My TestSnip",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Snippets"
                    ],
                    "contributes": {
                        "snippets": [{
                            "language": "python",
                            "path": "./snippets/snippets.code-snippets"
                        }]
                    }
                };
                try {
                    assertFiles(runResults, 'testSnip', ['snippets/snippets.code-snippets']);

                    runResults.assertJsonFileContent('testSnip/package.json', expectedPackageJSON);
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
                languageId: 'python'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testSnip",
                    "displayName": 'Test Snip',
                    "description": "My TestSnip",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Snippets"
                    ],
                    "contributes": {
                        "snippets": [{
                            "language": "python",
                            "path": "./snippets/snippets.code-snippets"
                        }]
                    }
                };
                const expectedSnippet = {
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
                    assertFiles(runResults, 'testSnip', ['snippets/snippets.code-snippets']);

                    runResults.assertJsonFileContent('testSnip/package.json', expectedPackageJSON);
                    runResults.assertJsonFileContent('testSnip/snippets/snippets.code-snippets', expectedSnippet);


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
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testKeym",
                    "displayName": 'Test Keym',
                    "description": "My TestKeym",
                    "version": "0.0.1",
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
                    assertFiles(runResults, 'testKeym', []);

                    runResults.assertJsonFileContent('testKeym/package.json', expectedPackageJSON);

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
                gitInit: true,
                pkgManager: 'npm'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:testCom.helloWorld"
                    ],
                    "devDependencies": devDependencies([
                        "@types/vscode",
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "eslint",
                        "@typescript-eslint/parser",
                        "@typescript-eslint/eslint-plugin",
                        "glob",
                        "mocha",
                        "typescript",
                        "vscode-test"
                    ]),
                    "main": "./out/extension.js",
                    "scripts": {
                        "vscode:prepublish": "npm run compile",
                        "compile": "tsc -p ./",
                        "lint": "eslint src --ext ts",
                        "watch": "tsc -watch -p ./",
                        "pretest": "npm run compile && npm run lint",
                        "test": "node ./out/test/runTest.js"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "testCom.helloWorld",
                            "title": "Hello World"
                        }]
                    }
                };
                try {
                    assertFiles(runResults, 'testCom', ['src/extension.ts', 'src/test/suite/extension.test.ts', 'src/test/suite/index.ts', 'tsconfig.json']);

                    runResults.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('command-ts with yarn', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-ts',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                gitInit: false,
                pkgManager: 'yarn'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:testCom.helloWorld"
                    ],
                    "devDependencies": devDependencies([
                        "@types/vscode",
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "eslint",
                        "@typescript-eslint/parser",
                        "@typescript-eslint/eslint-plugin",
                        "glob",
                        "mocha",
                        "typescript",
                        "vscode-test"
                    ]),
                    "main": "./out/extension.js",
                    "scripts": {
                        "vscode:prepublish": "yarn run compile",
                        "compile": "tsc -p ./",
                        "lint": "eslint src --ext ts",
                        "watch": "tsc -watch -p ./",
                        "pretest": "yarn run compile && yarn run lint",
                        "test": "node ./out/test/runTest.js"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "testCom.helloWorld",
                            "title": "Hello World"
                        }]
                    }
                };
                const expectedTsConfig = {
                    "compilerOptions": {
                        "module": "commonjs",
                        "target": "es6",
                        "outDir": "out",
                        "lib": [
                            "es6"
                        ],
                        "sourceMap": true,
                        "rootDir": "src",
                        "strict": true
                    },
                    "exclude": [
                        "node_modules",
                        ".vscode-test"
                    ]
                };
                try {
                    assertFiles(runResults, 'testCom', ['src/extension.ts', 'src/test/suite/extension.test.ts', 'src/test/suite/index.ts', 'tsconfig.json', '.eslintrc.json', '.vscode/extensions.json']);

                    runResults.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

                    const tsconfigBody = JSON.parse(stripComments(runResults.fs.read('testCom/tsconfig.json')));
                    runResults.assertObjectContent(tsconfigBody, expectedTsConfig);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });

    it('command-ts with webpack', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-ts',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                gitInit: true,
                pkgManager: 'npm',
                webpack: true
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:testCom.helloWorld"
                    ],
                    "devDependencies": devDependencies([
                        "@types/vscode",
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "eslint",
                        "@typescript-eslint/parser",
                        "@typescript-eslint/eslint-plugin",
                        "glob",
                        "mocha",
                        "typescript",
                        "vscode-test",
                        "webpack",
                        "webpack-cli",
                        "ts-loader"
                    ]),
                    "main": "./dist/extension.js",
                    "scripts": {
                        "vscode:prepublish": "npm run package",
                        "compile": "webpack",
                        "watch": "webpack --watch",
                        "package": "webpack --mode production --devtool hidden-source-map",
                        "test-compile": "tsc -p ./",
                        "test-watch": "tsc -watch -p ./",
                        "lint": "eslint src --ext ts",
                        "pretest": "npm run test-compile && npm run lint",
                        "test": "node ./out/test/runTest.js"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "testCom.helloWorld",
                            "title": "Hello World"
                        }]
                    }
                };
                try {


                    assertFiles(runResults, 'testCom', ['src/extension.ts', 'src/test/suite/extension.test.ts', 'src/test/suite/index.ts', 'tsconfig.json']);

                    runResults.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

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
                checkJavaScript: false,
                gitInit: false,
                pkgManager: 'npm'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:testCom.helloWorld"
                    ],
                    "devDependencies": devDependencies([
                        "@types/vscode",
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "eslint",
                        "glob",
                        "mocha",
                        "typescript",
                        "vscode-test"
                    ]),
                    "main": "./extension.js",
                    "scripts": {
                        "lint": "eslint .",
                        "pretest": "npm run lint",
                        "test": "node ./test/runTest.js"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "testCom.helloWorld",
                            "title": "Hello World"
                        }]
                    }
                };
                try {


                    assertFiles(runResults, 'testCom', ['extension.js', 'test/suite/extension.test.js', 'test/suite/index.js', 'jsconfig.json']);

                    runResults.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

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
                checkJavaScript: true,
                gitInit: false,
                pkgManager: 'yarn'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedJSConfig = {
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
                    const tsconfigBody = JSON.parse(stripComments(runResults.fs.read('testCom/jsconfig.json')));
                    runResults.assertObjectContent(tsconfigBody, expectedJSConfig);

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
                description: 'My Test Extension Pack'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testExtensionPack",
                    "displayName": "Test Extension Pack",
                    "description": "My Test Extension Pack",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Extension Packs"
                    ],
                    "extensionPack": [
                        "publisher.extensionName"
                    ]
                };
                try {
                    assertFiles(runResults, 'testExtensionPack', []);

                    runResults.assertJsonFileContent('testExtensionPack/package.json', expectedPackageJSON);

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
                pkgManager: 'npm'
            }).toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "vscode-language-pack-ru",
                    "displayName": "Russian Language Pack",
                    "description": "Language pack extension for Russian",
                    "version": "0.0.1",
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
                    assertFiles(runResults, 'vscode-language-pack-ru', []);

                    runResults.assertJsonFileContent('vscode-language-pack-ru/package.json', expectedPackageJSON);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('language pack with yarn', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-localization',
                name: "vscode-language-pack-ru",
                displayName: "Russian Language Pack",
                description: "Language pack extension for Russian",
                lpLanguageId: 'ru',
                lpLanguageName: 'Russian',
                lpLocalizedLanguageName: 'русский',
                pkgManager: 'yarn'
            }).toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "vscode-language-pack-ru",
                    "displayName": "Russian Language Pack",
                    "description": "Language pack extension for Russian",
                    "version": "0.0.1",
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
                        "update": "cd ../vscode && yarn run update-localization-extension ru"
                    }
                };
                try {
                    assertFiles(runResults, 'vscode-language-pack-ru', []);

                    runResults.assertJsonFileContent('vscode-language-pack-ru/package.json', expectedPackageJSON);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });

    it('command-web', function (done) {
        this.timeout(10000);

        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-command-web',
                name: 'testCom',
                displayName: 'Test Com',
                description: 'My TestCom',
                gitInit: true,
                pkgManager: 'npm'
            }) // Mock the prompt answers
            .toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "testCom",
                    "displayName": 'Test Com',
                    "description": "My TestCom",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "activationEvents": [
                        "onCommand:testCom.helloWorld"
                    ],
                    "devDependencies": devDependencies([
                        "@types/vscode",
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "@types/webpack-env",
                        "eslint",
                        "@typescript-eslint/parser",
                        "@typescript-eslint/eslint-plugin",
                        "assert",
                        "glob",
                        "mocha",
                        "process",
                        "typescript",
                        "ts-loader",
                        "vscode-test",
                        "webpack",
                        "webpack-cli"
                    ]),
                    "browser": "./dist/web/extension.js",
                    "scripts": {
                        "test": "node ./dist/web/test/runTest.js",
                        "pretest": "npm run compile-web && tsc ./src/web/test/runTest.ts --outDir ./dist --rootDir ./src --target es6 --module commonjs",
                        "vscode:prepublish": "npm run package-web",
                        "compile-web": "webpack --config ./build/web-extension.webpack.config.js",
                        "watch-web": "webpack --watch --config ./build/web-extension.webpack.config.js",
                        "package-web": "webpack --mode production --devtool hidden-source-map --config ./build/web-extension.webpack.config.js",
                        "lint": "eslint src --ext ts"
                    },
                    "categories": [
                        "Other"
                    ],
                    "contributes": {
                        "commands": [{
                            "command": "testCom.helloWorld",
                            "title": "Hello World"
                        }]
                    }
                };
                try {
                    assertFiles(runResults, 'testCom', ['src/web/extension.ts', 'build/web-extension.webpack.config.js', 'src/web/test/suite/extension.test.ts', 'src/web/test/suite/index.ts', 'tsconfig.json']);

                    runResults.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

                    done();
                } catch (e) {
                    done(e);
                }
            });
    });


    it('sample notebook renderer', function (done) {
        helpers.run(path.join(__dirname, '../generators/app'))
            .withPrompts({
                type: 'ext-notebook-renderer',
                name: 'json-renderer-ext',
                displayName: 'Cool JSON Renderer Extension',
                description: '',
                rendererId: 'json-renderer',
                rendererDisplayName: 'JSON Renderer',
                includeContentProvider: false,
                gitInit: true,
                pkgManager: 'yarn'
            }).toPromise().then(runResults => {
                const expectedPackageJSON = {
                    "name": "json-renderer-ext",
                    "displayName": "Cool JSON Renderer Extension",
                    "description": "",
                    "version": "0.0.1",
                    "engines": {
                        "vscode": engineVersion
                    },
                    "categories": [
                        "Other"
                    ],
                    "enableProposedApi": true,
                    "activationEvents": [],
                    "main": "./out/extension/extension.js",
                    "contributes": {
                        "notebookOutputRenderer": [
                            {
                                "entrypoint": "./out/client/index.js",
                                "id": "json-renderer",
                                "displayName": "JSON Renderer",
                                "mimeTypes": ["application/json"]
                            }
                        ]
                    },
                    "scripts": {
                        "vscode:prepublish": "npm run compile && node out/test/checkNoTestProvider.js",
                        "compile": "npm run compile:extension && npm run compile:client",
                        "compile:extension": "tsc -b",
                        "compile:client": "webpack --mode production",
                        "lint": "eslint src --ext ts",
                        "watch": "concurrently -r \"npm:watch:*\"",
                        "watch:extension": "tsc -b --watch",
                        "watch:client": "webpack --mode development --watch",
                        "dev": "concurrently -r npm:watch:extension npm:watch:client",
                        "pretest": "npm run compile && npm run lint",
                        "test": "node ./out/test/runTest.js",
                        "updatetypes": "cd src/extension/types && vscode-dts dev && vscode-dts master && cd ../../test/types && vscode-dts dev && vscode-dts master",
                        "postinstall": "npm run updatetypes"
                    },
                    "devDependencies": devDependencies([
                        "@types/glob",
                        "@types/mocha",
                        "@types/node",
                        "@types/webpack-env",
                        "@typescript-eslint/eslint-plugin",
                        "@typescript-eslint/parser",
                        "@types/vscode-notebook-renderer",
                        "concurrently",
                        "css-loader",
                        "eslint",
                        "fork-ts-checker-webpack-plugin",
                        "glob",
                        "mocha",
                        "style-loader",
                        "ts-loader",
                        "typescript",
                        "vscode-dts",
                        "vscode-notebook-error-overlay",
                        "vscode-test",
                        "webpack",
                        "webpack-cli",
                    ])
                };
                try {
                    assertFiles(runResults, 'json-renderer-ext', ['webpack.config.js', '.gitignore', '.eslintrc.json']);

                    runResults.assertJsonFileContent('json-renderer-ext/package.json', expectedPackageJSON);

                    done();
                } catch (e) {
                    done(e);
                }
            }, done);
    });
});
