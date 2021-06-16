// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
<% if (includeContentProvider) { %>
import { SampleContentSerializer, SampleKernel } from './sampleProvider';<% } %>

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  <% if (includeContentProvider) { %>
  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer(
      'test-notebook-renderer', new SampleContentSerializer(), { transientOutputs: true }
    ),
    new SampleKernel()
  );
  <% } %>
}

// This method is called when your extension is deactivated
export function deactivate() { }
