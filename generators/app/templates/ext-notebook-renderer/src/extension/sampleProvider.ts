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
      cells: [
        {
          cellKind: vscode.CellKind.Code,
          source: `{ "hello": "world!" }`,
          language: 'json',
          outputs: [],
          metadata: {},
        },
      ],
      languages: ['json'],
      metadata: {},
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

  cancelCellExecution() {}

  cancelAllCellsExecution() {}

  executeAllCells(doc: vscode.NotebookDocument) {
    doc.cells.forEach((cell) => this.executeCell(doc, cell));
  }

  executeCell(_doc: vscode.NotebookDocument, cell: vscode.NotebookCell) {
    if (cell?.language !== 'json') {
      return;
    }

    try {
      cell.outputs = [
        {
          outputKind: vscode.CellOutputKind.Rich,
          data: { '<%- rendererMimeTypes[0] %>': JSON.parse(cell.document.getText()) },
        },
      ];
    } catch (e) {
      cell.outputs = [
        {
          outputKind: vscode.CellOutputKind.Error,
          ename: e.constructor.name,
          evalue: e.message,
          traceback: e.stack,
        },
      ];
    }
  }
}
