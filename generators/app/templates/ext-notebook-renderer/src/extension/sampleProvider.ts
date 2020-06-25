import * as vscode from 'vscode';

/**
 * An ultra-minimal sample provider that lets the user type in JSON, and then
 * outputs JSON cells. Doesn't read files or save anything.
 */
export class SampleProvider implements vscode.NotebookContentProvider, vscode.NotebookKernel {
  label: string = 'CPU Profile Notebook';

  public readonly onDidChangeNotebook = new vscode.EventEmitter<vscode.NotebookDocumentEditEvent>()
    .event;

  public readonly kernel: vscode.NotebookKernel = {
    label: 'Default Kernel',
    executeCell: (document, cell) => this.executeCell(document, cell),
    executeAllCells: async (document) => {
      await Promise.all(document.cells.map((cell) => this.executeCell(document, cell)));
    },
  };

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
          source: JSON.stringify(require('../../package.json')),
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
  public async executeAllCells(
    document: vscode.NotebookDocument,
    _token: vscode.CancellationToken
  ): Promise<void> {
    for (let i = 0; i < document.cells.length; i++) {
      await this.executeCell(document, document.cells[i]);
    }
  }

  /**
   * @inheritdoc
   */
  public async executeCell(
    _document: vscode.NotebookDocument,
    cell: vscode.NotebookCell | undefined,
  ): Promise<void> {
    if (cell?.language !== 'json') {
      return;
    }

    try {
      cell.outputs = [
        {
          outputKind: vscode.CellOutputKind.Rich,
          data: { 'application/json': JSON.parse(cell.document.getText()) },
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
