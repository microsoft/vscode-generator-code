// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
<% if (includeContentProvider) { %>
import { SampleProvider, SampleKernel } from './sampleProvider';<% } %>

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  <% if (includeContentProvider) { %>
  context.subscriptions.push(
    vscode.notebook.registerNotebookContentProvider(
      'test-notebook-renderer', new SampleProvider()
    ),
    vscode.notebook.registerNotebookKernel(
      'test-notebook-kernel',
      ['*<%- contentProviderFileType %>'],
      new SampleKernel(),
    ),
  );
  <% } %>
}

// This method is called when your extension is deactivated
export function deactivate() { }
