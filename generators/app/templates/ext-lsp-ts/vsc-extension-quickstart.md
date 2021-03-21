# Welcome to your VS Code Language Server Extension

## What's in the folder

* This folder contains all of the files necessary for your extension.
* `package.json` - this is the manifest file in which you declare your extension and command.
  * The sample plugin registers a command and defines its title and command name. With this information VS Code can show the command in the command palette. It doesn’t yet need to load the plugin.
* `client` - this is folder containing the code of your extendion running on the UI side of VS Code.
* `server` - this is folder containing the code of your extendion running on the UI side of VS Code.

## Running the Sample

* Run `npm install` in the root folder. This installs all necessary npm modules in both the client and server folder
* Open VS Code on this folder.
* Press `Ctrl+Shift+B` to compile the client and server.
* Switch to the Debug viewlet.
* Select Launch Client from the drop down.
* Run the launch config.
* If you want to debug the server as well use the launch configuration Attach to Server
* In the [Extension Development Host] instance of VSCode, open a document in 'plain text' language mode.
* Activate code action on the error on the first line.

<!-- ## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`. -->

<!-- ## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.ts` or create new test files inside the `test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want. -->

## Go further

* [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VSCode extension marketplace.
* Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).
