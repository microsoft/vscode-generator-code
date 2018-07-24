'use strict';
// The module 'doppler' contains the VS Code extensibility API
// Import the module and reference it with the alias doppler in your code below
import * as doppler from 'doppler';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: doppler.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "<%= name %>" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = doppler.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        doppler.window.showInformationMessage('Hello World!');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}