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
  readonly id = 'sample-kernel';
  public readonly label = 'Sample Notebook Kernel';
  readonly supportedLanguages = ['json'];

  private _executionOrder = 0;

  async executeCellsRequest(document: vscode.NotebookDocument, ranges: vscode.NotebookCellRange[]): Promise<void> {
    for (let range of ranges) {
      for (let i = range.start; i < range.end; i++) {
        let cell = document.cells[i];
        const execution = vscode.notebook.createNotebookCellExecutionTask(cell.notebook.uri, cell.index, this.id)!;
        await this._doExecution(execution);
      }
    }
  }

  private async _doExecution(execution: vscode.NotebookCellExecutionTask): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(execution.cell.document.uri);

    execution.executionOrder = ++this._executionOrder;
    execution.start({ startTime: Date.now() });

    const metadata = {
      startTime: Date.now()
    };

    try {
      execution.replaceOutput([new vscode.NotebookCellOutput([
        new vscode.NotebookCellOutputItem('<%- rendererMimeTypes[0] %>', JSON.parse(doc.getText())),
      ], metadata)]);

      execution.end({ success: true });
    } catch (err) {
      execution.replaceOutput([new vscode.NotebookCellOutput([
        new vscode.NotebookCellOutputItem('application/x.notebook.error-traceback', {
          ename: err instanceof Error && err.name || 'error',
          evalue: err instanceof Error && err.message || JSON.stringify(err, undefined, 4),
          traceback: []
        })
      ])]);
      execution.end({ success: false });
    }
  }
}
