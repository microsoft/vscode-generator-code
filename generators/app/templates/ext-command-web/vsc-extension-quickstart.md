# Welcome to your VS Code Extension

## What's in the folder

* This folder contains all of the files necessary for your web extension.
* `package.json` - this is the manifest file in which you declare your extension and command.
* `src/web/extension.ts` - this is the main file for the browser
* `build/web-extension.webpack.config.js` - the webpack config file for the web main

## Get up and running the Web Extension

* ⚠️ configure in vscode: `"extensions.webWorker": true`
* `npm install`
* place breakpoints in `src/web/extension.ts`
* debug via F5 (Run Extension)
* execute extension code via `F1 > Hello world`

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/web/extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.


## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.ts` or create new test files inside the `test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.

## Go further

 * [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VSCode extension marketplace.
 * Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
