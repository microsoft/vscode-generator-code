'use strict';
const vscode = require("vscode");
function activate(context) {
    console.log('Congratulations, your extension "<%= name %>" is now active!');
    const disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        vscode.window.showInformationMessage('Hello World!');
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
;
//# sourceMappingURL=extension.js.map