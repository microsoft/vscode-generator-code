import * as vscode from 'vscode';

/**
 * An ultra-minimal sample provider that lets the user type in JSON, and then
 * outputs JSON cells. Doesn't read files or save anything.
 */
export class SampleContentProvider implements vscode.NotebookContentProvider {
  public readonly label: string = 'My Sample Content Provider';

  /**
   * @inheritdoc
   */
  public resolveNotebook() {
    return Promise.resolve();
  }

  /**
   * @inheritdoc
   */
  public async backupNotebook() {
    return { id: '', delete: () => undefined };
  }

  /**
   * @inheritdoc
   */
  public async openNotebook(): Promise<vscode.NotebookData> {
    return {
      metadata:new vscode.NotebookDocumentMetadata().with({
        editable: true,
        cellEditable: true,
      }),
      cells: [ new vscode.NotebookCellData(vscode.NotebookCellKind.Code, `{ "hello": "world!" }`, 'json', [])]
    };
  }

  /**
   * @inheritdoc
   */
  public async saveNotebook(): Promise<void> {
    return Promise.resolve(); // not implemented
  }

  /**
   * @inheritdoc
   */
  public async saveNotebookAs(): Promise<void> {
    return Promise.resolve(); // not implemented
  }
}

export class SampleKernelProvider implements vscode.NotebookKernelProvider {
  public readonly label = 'My Sample Kernel Provider';

  provideKernels(): vscode.ProviderResult<vscode.NotebookKernel[]> {
    return [new SampleKernel()];
  }

  resolveKernel(): vscode.ProviderResult<void> {
    return Promise.resolve(); // not implemented
  }
}

export class SampleKernel implements vscode.NotebookKernel {
  public readonly label = 'Sample Notebook Kernel';
  readonly supportedLanguages = ['json'];

  cancelCellExecution() {}

  cancelAllCellsExecution() {}

  executeAllCells(doc: vscode.NotebookDocument) {
    doc.cells.forEach((cell) => this.executeCell(doc, cell));
  }

  executeCell(_doc: vscode.NotebookDocument, cell: vscode.NotebookCell) {
    const edit = new vscode.WorkspaceEdit();

    try {
      const output: vscode.NotebookCellOutput[] = [ new vscode.NotebookCellOutput(
        [
          new vscode.NotebookCellOutputItem('<%- rendererMimeTypes[0] %>', JSON.parse(cell.document.getText()))
        ]
      )];

      edit.replaceNotebookCellOutput(cell.notebook.uri, cell.index, output);
    } catch (e) {
      const errorOutput: vscode.NotebookCellOutput[] = [new vscode.NotebookCellOutput([
          new vscode.NotebookCellOutputItem('application/x.notebook.error-traceback', {
              ename: e instanceof Error && e.name || 'error',
              evalue: e instanceof Error && e.message || JSON.stringify(e, undefined, 4),
              traceback: []
          })
      ])];

      edit.replaceNotebookCellOutput(cell.notebook.uri, cell.index, errorOutput);
    }

    return vscode.workspace.applyEdit(edit);
  }
}
