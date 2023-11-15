/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as path from 'path';
import { fileURLToPath } from 'url';
import { RunResult, createHelpers } from 'yeoman-test';
import * as env from '../generators/app/env.js';
import { cwd } from 'process';

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

  const helpers = createHelpers();
  const appLocation = path.join(fileURLToPath(import.meta.url), '../../generators/app');
  const fixturesLocation = path.join(fileURLToPath(import.meta.url), '../fixtures');

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
   * @param {import('yeoman-test').RunResult} runResult
   * @param {String} extensionName
   * @param {String[]} expectedFileNames
   */
  function assertFiles(runResult, extensionName, expectedFileNames) {
    const allFileNames = expectedFileNames.concat(standartFiles).map(fileName => `${extensionName}/${fileName}`);

    runResult.assertFile(allFileNames);
  }

  /**
   * @param {import('yeoman-test').RunResult} runResult
   */
  function cleanup(runResult) {
    try {
      runResult.cleanup();
    } catch (e) {
     // console.error('cleanup failed', e);
    }
  }

  it('theme import from file', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-colortheme',
      themeImportType: 'import-keep',
      themeURL: path.join(fixturesLocation, 'themes/new theme.tmTheme'),
      name: 'testTheme',
      displayName: 'Test Theme',
      description: 'My TestTheme',
      themeName: 'Green',
      themeBase: 'vs-dark',
      openWith: 'skip'
    }); // Mock the prompt answers

    try {
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

      assertFiles(runResult, 'testTheme', ['themes/Green-color-theme.json', 'themes/new theme.tmTheme']);

      runResult.assertJsonFileContent('testTheme/package.json', expectedPackageJSON);
      runResult.assertJsonFileContent('testTheme/themes/Green-color-theme.json', expectedColorTheme);
    } finally {
      cleanup(runResult);
    }
  });

  it('theme import from file - issue 74', async () => {

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-colortheme',
      themeImportType: 'import-inline',
      themeURL: path.join(fixturesLocation, 'themes/theme-74.tmTheme'),
      name: 'theme74',
      displayName: 'Theme 74',
      description: 'Theme SeventyFour',
      themeName: 'Theme 74',
      themeBase: 'vs-dark',
      openWith: 'skip'
    }); // Mock the prompt answers

    try {
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

      assertFiles(runResult, 'theme74', ['themes/Theme 74-color-theme.json']);

      runResult.assertJsonFileContent('theme74/package.json', expectedPackageJSON);
      runResult.assertJsonFileContent('theme74/themes/Theme 74-color-theme.json', expectedColorTheme);
    } finally {
      cleanup(runResult);
    }
  });


  it('theme new', async () => {

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-colortheme',
      themeImportType: 'new',
      name: 'testTheme',
      displayName: 'Test Theme',
      description: 'My TestTheme',
      themeName: 'Funky',
      themeBase: 'vs',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testTheme', ['themes/Funky-color-theme.json']);

      runResult.assertJsonFileContent('testTheme/package.json', expectedPackageJSON);
      runResult.assertJsonFileContent('testTheme/themes/Funky-color-theme.json', { name: 'Funky', colors: { 'editor.background': "#f5f5f5" } });
    } finally {
      cleanup(runResult);
    }
  });

  it('theme new hc light', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-colortheme',
      themeImportType: 'new',
      name: 'testHCLTheme',
      displayName: 'Test HCL Theme',
      description: 'My HCL TestTheme',
      themeName: 'Funky HCL',
      themeBase: 'hc-light',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testHCLTheme",
        "displayName": "Test HCL Theme",
        "description": "My HCL TestTheme",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "categories": [
          "Themes"
        ],
        "contributes": {
          "themes": [{
            "label": "Funky HCL",
            "uiTheme": "hc-light",
            "path": "./themes/Funky HCL-color-theme.json"
          }]
        }
      };

      assertFiles(runResult, 'testHCLTheme', ['themes/Funky HCL-color-theme.json']);

      runResult.assertJsonFileContent('testHCLTheme/package.json', expectedPackageJSON);
      runResult.assertJsonFileContent('testHCLTheme/themes/Funky HCL-color-theme.json', { name: 'Funky HCL', colors: { 'editor.background': "#f5f5f5" } });
    } finally {
      cleanup(runResult);
    }
  });

  it('language import', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-language',
      tmLanguageURL: 'http://raw.githubusercontent.com/textmate/ant.tmbundle/master/Syntaxes/Ant.tmLanguage',
      name: 'testLan',
      displayName: 'Test Lan',
      description: 'My TestLan',
      languageId: 'ant',
      languageName: 'ANT',
      languageScopeName: 'text.xml.ant',
      languageExtensions: '.ant',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testLan', ['syntaxes/ant.tmLanguage']);

      runResult.assertJsonFileContent('testLan/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('language import 2', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-language',
      tmLanguageURL: path.join(fixturesLocation, 'grammars/foo.tmLanguage.json'),
      name: 'testFooLan',
      displayName: 'Test Foo Lan',
      description: 'My TestFooLan',
      languageId: 'foo',
      languageName: 'FOO',
      languageScopeName: 'source.foo',
      languageExtensions: '.foo',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testFooLan', ['syntaxes/foo.tmLanguage.json', 'language-configuration.json']);

      runResult.assertJsonFileContent('testFooLan/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('language new', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-language',
      tmLanguageURL: '',
      name: 'crusty',
      displayName: 'Crusty',
      description: 'Crusty, the language',
      languageId: 'crusty',
      languageName: 'Crusty',
      languageScopeName: 'source.crusty',
      languageExtensions: '.crusty',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'crusty', ['syntaxes/crusty.tmLanguage.json', 'language-configuration.json']);

      runResult.assertJsonFileContent('crusty/package.json', expectedPackageJSON);

      runResult.assertJsonFileContent('crusty/syntaxes/crusty.tmLanguage.json', {
        name: 'Crusty',
        scopeName: 'source.crusty'
      });
    } finally {
      cleanup(runResult);
    }
  });

  it('snippet new', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-snippets',
      snippetPath: '',
      name: 'testSnip',
      displayName: 'Test Snip',
      description: 'My TestSnip',
      languageId: 'python',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testSnip', ['snippets/snippets.code-snippets']);

      runResult.assertJsonFileContent('testSnip/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('snippet import', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-snippets',
      snippetPath: path.join(fixturesLocation, 'tmsnippets'),
      name: 'testSnip',
      displayName: 'Test Snip',
      description: 'My TestSnip',
      languageId: 'python',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testSnip', ['snippets/snippets.code-snippets']);

      runResult.assertJsonFileContent('testSnip/package.json', expectedPackageJSON);
      runResult.assertJsonFileContent('testSnip/snippets/snippets.code-snippets', expectedSnippet);
    } finally {
      cleanup(runResult);
    }
  });

  it('keymap new', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-keymap',
      name: 'testKeym',
      displayName: 'Test Keym',
      description: 'My TestKeym',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testKeym', []);

      runResult.assertJsonFileContent('testKeym/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-ts', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-ts',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: true,
      pkgManager: 'npm',
      openWith: 'skip'
    }); // Mock the prompt answers

    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "eslint",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron"
        ]),
        "main": "./out/extension.js",
        "scripts": {
          "vscode:prepublish": "npm run compile",
          "compile": "tsc -p ./",
          "lint": "eslint src --ext ts",
          "watch": "tsc -watch -p ./",
          "pretest": "npm run compile && npm run lint",
          "test": "vscode-test"
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

      assertFiles(runResult, 'testCom', ['src/extension.ts', 'src/test/extension.test.ts', 'tsconfig.json']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-ts with yarn', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-ts',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: false,
      pkgManager: 'yarn',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "eslint",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron"
        ]),
        "main": "./out/extension.js",
        "scripts": {
          "vscode:prepublish": "yarn run compile",
          "compile": "tsc -p ./",
          "lint": "eslint src --ext ts",
          "watch": "tsc -watch -p ./",
          "pretest": "yarn run compile && yarn run lint",
          "test": "vscode-test"
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
          "module": "Node16",
          "target": "ES2022",
          "outDir": "out",
          "lib": [
            "ES2022"
          ],
          "sourceMap": true,
          "rootDir": "src",
          "strict": true
        }
      };

      assertFiles(runResult, 'testCom', ['src/extension.ts', 'src/test/extension.test.ts', 'tsconfig.json', '.eslintrc.json', '.vscode-test.mjs', '.vscode/extensions.json']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

      const tsconfigBody = JSON.parse(stripComments(runResult.fs.read('testCom/tsconfig.json')));
      runResult.assertObjectContent(tsconfigBody, expectedTsConfig);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-ts with pnpm', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-ts',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: false,
      pkgManager: 'pnpm',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "eslint",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron"
        ]),
        "main": "./out/extension.js",
        "scripts": {
          "vscode:prepublish": "pnpm run compile",
          "compile": "tsc -p ./",
          "lint": "eslint src --ext ts",
          "watch": "tsc -watch -p ./",
          "pretest": "pnpm run compile && pnpm run lint",
          "test": "vscode-test"
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
          "module": "Node16",
          "target": "ES2022",
          "outDir": "out",
          "lib": [
            "ES2022"
          ],
          "sourceMap": true,
          "rootDir": "src",
          "strict": true
        }
      };

      assertFiles(runResult, 'testCom', ['src/extension.ts', 'src/test/extension.test.ts', 'tsconfig.json', '.eslintrc.json', '.vscode-test.mjs', '.vscode/extensions.json', '.npmrc']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);

      const tsconfigBody = JSON.parse(stripComments(runResult.fs.read('testCom/tsconfig.json')));
      runResult.assertObjectContent(tsconfigBody, expectedTsConfig);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-ts with webpack', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-ts',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: true,
      pkgManager: 'npm',
      webpack: true,
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "eslint",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron",
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
          "compile-tests": "tsc -p . --outDir out",
          "watch-tests": "tsc -p . -w --outDir out",
          "lint": "eslint src --ext ts",
          "pretest": "npm run compile-tests && npm run compile && npm run lint",
          "test": "vscode-test"
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

      assertFiles(runResult, 'testCom', ['src/extension.ts', 'src/test/extension.test.ts', 'tsconfig.json']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-ts with webpack + pnpm', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-ts',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: true,
      pkgManager: 'pnpm',
      webpack: true,
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "eslint",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron",
          "webpack",
          "webpack-cli",
          "ts-loader"
        ]),
        "main": "./dist/extension.js",
        "scripts": {
          "vscode:prepublish": "pnpm run package",
          "compile": "webpack",
          "watch": "webpack --watch",
          "package": "webpack --mode production --devtool hidden-source-map",
          "compile-tests": "tsc -p . --outDir out",
          "watch-tests": "tsc -p . -w --outDir out",
          "lint": "eslint src --ext ts",
          "pretest": "pnpm run compile-tests && pnpm run compile && pnpm run lint",
          "test": "vscode-test"
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

      assertFiles(runResult, 'testCom', ['src/extension.ts', 'src/test/extension.test.ts', 'tsconfig.json', '.npmrc']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-js', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-js',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      checkJavaScript: false,
      gitInit: false,
      pkgManager: 'npm',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "eslint",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron"
        ]),
        "main": "./extension.js",
        "scripts": {
          "lint": "eslint .",
          "pretest": "npm run lint",
          "test": "vscode-test"
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

      assertFiles(runResult, 'testCom', ['extension.js', 'test/extension.test.js', 'jsconfig.json']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-js with pnpm', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-js',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      checkJavaScript: false,
      gitInit: false,
      pkgManager: 'pnpm',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/node",
          "eslint",
          "typescript",
          "@vscode/test-cli",
          "@vscode/test-electron"
        ]),
        "main": "./extension.js",
        "scripts": {
          "lint": "eslint .",
          "pretest": "pnpm run lint",
          "test": "vscode-test"
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

      assertFiles(runResult, 'testCom', ['extension.js', 'test/extension.test.js', 'jsconfig.json', '.npmrc']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-js with check JS', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-js',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      checkJavaScript: true,
      gitInit: false,
      pkgManager: 'yarn',
      openWith: 'skip'
    }); // Mock the prompt answers
    try {
      const expectedJSConfig = {
        "compilerOptions": {
          "module": "Node16",
          "target": "ES2022",
          "checkJs": true,
          "lib": [
            "ES2022"
          ]
        },
        "exclude": [
          "node_modules"
        ]
      };

      const jsconfigBody = JSON.parse(stripComments(runResult.fs.read('testCom/jsconfig.json')));
      runResult.assertObjectContent(jsconfigBody, expectedJSConfig);
    } finally {
      cleanup(runResult);
    }
  });


  it('extension-pack', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      addExtensions: false,
      type: 'ext-extensionpack',
      name: 'testExtensionPack',
      displayName: 'Test Extension Pack',
      description: 'My Test Extension Pack',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
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

      assertFiles(runResult, 'testExtensionPack', []);

      runResult.assertJsonFileContent('testExtensionPack/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('language pack', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-localization',
      lpLanguageId: 'ru',
      lpLanguageName: 'Russian',
      lpLocalizedLanguageName: 'русский',
      pkgManager: 'npm',
      openWith: 'skip'
    });

    try {
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

      assertFiles(runResult, 'vscode-language-pack-ru', []);

      runResult.assertJsonFileContent('vscode-language-pack-ru/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('language pack with yarn', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-localization',
      name: "vscode-language-pack-ru",
      displayName: "Russian Language Pack",
      description: "Language pack extension for Russian",
      lpLanguageId: 'ru',
      lpLanguageName: 'Russian',
      lpLocalizedLanguageName: 'русский',
      pkgManager: 'yarn',
      openWith: 'skip'
    });

    try {
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

      assertFiles(runResult, 'vscode-language-pack-ru', []);

      runResult.assertJsonFileContent('vscode-language-pack-ru/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('language pack with pnpm', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-localization',
      name: "vscode-language-pack-ru",
      displayName: "Russian Language Pack",
      description: "Language pack extension for Russian",
      lpLanguageId: 'ru',
      lpLanguageName: 'Russian',
      lpLocalizedLanguageName: 'русский',
      pkgManager: 'pnpm',
      openWith: 'skip'
    });

    try {
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
          "update": "cd ../vscode && pnpm run update-localization-extension ru"
        }
      };

      assertFiles(runResult, 'vscode-language-pack-ru', []);

      runResult.assertJsonFileContent('vscode-language-pack-ru/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-web', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-web',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: true,
      pkgManager: 'npm',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/webpack-env",
          "eslint",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "assert",
          "mocha",
          "process",
          "typescript",
          "ts-loader",
          "vscode-test-web",
          "webpack",
          "webpack-cli"
        ]),
        "browser": "./dist/web/extension.js",
        "scripts": {
          "test": "vscode-test-web --browserType=chromium --extensionDevelopmentPath=. --extensionTestsPath=dist/web/test/suite/index.js",
          "pretest": "npm run compile-web",
          "vscode:prepublish": "npm run package-web",
          "compile-web": "webpack",
          "watch-web": "webpack --watch",
          "package-web": "webpack --mode production --devtool hidden-source-map",
          "lint": "eslint src --ext ts",
          "run-in-browser": "vscode-test-web --browserType=chromium --extensionDevelopmentPath=. ."
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

      assertFiles(runResult, 'testCom', ['src/web/extension.ts', 'webpack.config.js', 'src/web/test/suite/extension.test.ts', 'src/web/test/suite/index.ts', 'tsconfig.json']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('command-web with pnpm', async () => {
    this.timeout(10000);

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-command-web',
      name: 'testCom',
      displayName: 'Test Com',
      description: 'My TestCom',
      gitInit: true,
      pkgManager: 'pnpm',
      openWith: 'skip'
    }); // Mock the prompt answers


    try {
      const expectedPackageJSON = {
        "name": "testCom",
        "displayName": 'Test Com',
        "description": "My TestCom",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "activationEvents": [],
        "devDependencies": devDependencies([
          "@types/vscode",
          "@types/mocha",
          "@types/webpack-env",
          "eslint",
          "@typescript-eslint/parser",
          "@typescript-eslint/eslint-plugin",
          "assert",
          "mocha",
          "process",
          "typescript",
          "ts-loader",
          "vscode-test-web",
          "webpack",
          "webpack-cli"
        ]),
        "browser": "./dist/web/extension.js",
        "scripts": {
          "test": "vscode-test-web --browserType=chromium --extensionDevelopmentPath=. --extensionTestsPath=dist/web/test/suite/index.js",
          "pretest": "pnpm run compile-web",
          "vscode:prepublish": "pnpm run package-web",
          "compile-web": "webpack",
          "watch-web": "webpack --watch",
          "package-web": "webpack --mode production --devtool hidden-source-map",
          "lint": "eslint src --ext ts",
          "run-in-browser": "vscode-test-web --browserType=chromium --extensionDevelopmentPath=. ."
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

      assertFiles(runResult, 'testCom', ['src/web/extension.ts', 'webpack.config.js', 'src/web/test/suite/extension.test.ts', 'src/web/test/suite/index.ts', 'tsconfig.json', '.npmrc']);

      runResult.assertJsonFileContent('testCom/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });


  it('sample notebook renderer', async () => {
    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-notebook-renderer',
      name: 'json-renderer-ext',
      displayName: 'Cool JSON Renderer Extension',
      description: '',
      rendererId: 'json-renderer',
      rendererDisplayName: 'JSON Renderer',
      gitInit: true,
      pkgManager: 'npm',
      openWith: 'skip'
    });

    try {
      const expectedPackageJSON = {
        "name": "json-renderer-ext",
        "displayName": "Cool JSON Renderer Extension",
        "description": "",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "keywords": [
          "notebookRenderer"
        ],
        "categories": [
          "Other"
        ],
        "activationEvents": [],
        "main": "./out/extension/extension.js",
        "contributes": {
          "notebookRenderer": [
            {
              "entrypoint": "./out/client/index.js",
              "id": "json-renderer",
              "displayName": "JSON Renderer",
              "mimeTypes": ["x-application/custom-json-output"]
            }
          ]
        },
        "scripts": {
          "vscode:prepublish": "npm run compile",
          "compile": "webpack --mode production",
          "lint": "eslint src --ext ts",
          "watch": "webpack --mode development --watch",
          "pretest": "webpack --mode development && npm run lint",
          "test": "vscode-test"
        },
        "devDependencies": devDependencies([
          "@types/mocha",
          "@types/node",
          "@types/vscode",
          "@types/webpack-env",
          "@typescript-eslint/eslint-plugin",
          "@typescript-eslint/parser",
          "@types/vscode-notebook-renderer",
          "css-loader",
          "eslint",
          "fork-ts-checker-webpack-plugin",
          "style-loader",
          "ts-loader",
          "typescript",
          "vscode-notebook-error-overlay",
          "@vscode/test-cli",
          "@vscode/test-electron",
          "util",
          "webpack",
          "webpack-cli",
        ])
      };

      assertFiles(runResult, 'json-renderer-ext', ['webpack.config.js', '.gitignore', '.vscode-test.mjs', '.eslintrc.json']);

      runResult.assertJsonFileContent('json-renderer-ext/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  });

  it('sample notebook renderer with pnpm', async () => {

    const runResult = await helpers.run(appLocation).withAnswers({
      type: 'ext-notebook-renderer',
      name: 'json-renderer-ext',
      displayName: 'Cool JSON Renderer Extension',
      description: '',
      rendererId: 'json-renderer',
      rendererDisplayName: 'JSON Renderer',
      gitInit: true,
      pkgManager: 'pnpm',
      openWith: 'skip'
    });

    try {


      const expectedPackageJSON = {
        "name": "json-renderer-ext",
        "displayName": "Cool JSON Renderer Extension",
        "description": "",
        "version": "0.0.1",
        "engines": {
          "vscode": engineVersion
        },
        "keywords": [
          "notebookRenderer"
        ],
        "categories": [
          "Other"
        ],
        "activationEvents": [],
        "main": "./out/extension/extension.js",
        "contributes": {
          "notebookRenderer": [
            {
              "entrypoint": "./out/client/index.js",
              "id": "json-renderer",
              "displayName": "JSON Renderer",
              "mimeTypes": ["x-application/custom-json-output"]
            }
          ]
        },
        "scripts": {
          "vscode:prepublish": "pnpm run compile",
          "compile": "webpack --mode production",
          "lint": "eslint src --ext ts",
          "watch": "webpack --mode development --watch",
          "pretest": "webpack --mode development && pnpm run lint",
          "test": "vscode-test"
        },
        "devDependencies": devDependencies([
          "@types/mocha",
          "@types/node",
          "@types/vscode",
          "@types/webpack-env",
          "@typescript-eslint/eslint-plugin",
          "@typescript-eslint/parser",
          "@types/vscode-notebook-renderer",
          "css-loader",
          "eslint",
          "fork-ts-checker-webpack-plugin",
          "style-loader",
          "ts-loader",
          "typescript",
          "vscode-notebook-error-overlay",
          "@vscode/test-cli",
          "@vscode/test-electron",
          "util",
          "webpack",
          "webpack-cli",
        ])
      };

      assertFiles(runResult, 'json-renderer-ext', ['webpack.config.js', '.gitignore', '.eslintrc.json', '.vscode-test.mjs', '.npmrc']);

      runResult.assertJsonFileContent('json-renderer-ext/package.json', expectedPackageJSON);
    } finally {
      cleanup(runResult);
    }
  })
});
