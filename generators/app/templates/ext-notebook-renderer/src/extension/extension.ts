// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { rendererId } from '../common/constants';
import { SampleRenderer } from './sampleRenderer';<% if (includeContentProvider) { %>
import { TestProvider } from './testProvider';<% } %>

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.notebook.registerNotebookOutputRenderer(
			rendererId,
			// The list of mime types this renderer knows how to render. Should
			// match those registered in your package.json:
			{ mimeTypes: <%- JSON.stringify(rendererMimeTypes) %> },
			new SampleRenderer(context),
		),<% if (includeContentProvider) { %>

		// todo: remove this before publishing:
		vscode.notebook.registerNotebookContentProvider(
			'test-notebook-renderer', new TestProvider()
		),<% } %>
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
