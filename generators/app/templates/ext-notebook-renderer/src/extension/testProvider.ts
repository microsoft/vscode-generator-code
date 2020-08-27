import * as vscode from 'vscode';

/**
 * An ultra-minimal test provider that lets the user type in JSON, and then
 * outputs JSON cells. Doesn't read files or save anything.
 */
export class TestProvider implements vscode.NotebookContentProvider {
  public readonly label: string = 'My Test Provider';

  public readonly onDidChangeNotebook = new vscode.EventEmitter<vscode.NotebookDocumentEditEvent>()
    .event;

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

export class TestKernel implements vscode.NotebookKernel {
  public readonly label = 'Test notebook kernel';

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
