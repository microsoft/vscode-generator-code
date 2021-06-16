import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from "util";

/**
 * An ultra-minimal sample provider that lets the user type in JSON, and then
 * outputs JSON cells. The outputs are transient and not saved to notebook file on disk.
 */

 interface RawNotebookData {
  cells: RawNotebookCell[]
}

interface RawNotebookCell {
  language: string;
  value: string;
  kind: vscode.NotebookCellKind;
  editable?: boolean;
}

export class SampleContentSerializer implements vscode.NotebookSerializer {
  public readonly label: string = 'My Sample Content Serializer';

  /**
   * @inheritdoc
   */
  public async deserializeNotebook(data: Uint8Array, token: vscode.CancellationToken): Promise<vscode.NotebookData> {
    var contents = new TextDecoder().decode(data);    // convert to String to make JSON object

    // Read file contents
    let raw: RawNotebookData;
    try {
      raw = <RawNotebookData>JSON.parse(contents);
    } catch {
      raw = { cells: [] };
    }

    // Create array of Notebook cells for the VS Code API from file contents
    const cells = raw.cells.map(item => new vscode.NotebookCellData(
      item.kind,
      item.value,
      item.language
    ));

    // Pass read and formatted Notebook Data to VS Code to display Notebook with saved cells
    return new vscode.NotebookData(
      cells
    );
  }

  /**
   * @inheritdoc
   */
  public async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
    // Map the Notebook data into the format we want to save the Notebook data as
    let contents: RawNotebookData = { cells: []};

    for (const cell of data.cells) {
      contents.cells.push({
        kind: cell.kind,
        language: cell.languageId,
        value: cell.value
      });
    }

    // Give a string of all the data to save and VS Code will handle the rest
    return new TextEncoder().encode(JSON.stringify(contents));
  }
}

export class SampleKernel {
  readonly id = 'test-notebook-renderer-kernel';
  public readonly label = 'Sample Notebook Kernel';
  readonly supportedLanguages = ['json'];

  private _executionOrder = 0;
  private readonly _controller: vscode.NotebookController;

  constructor() {

    this._controller = vscode.notebooks.createNotebookController(this.id,
                                                                'test-notebook-renderer',
                                                                this.label);

    this._controller.supportedLanguages = this.supportedLanguages;
    this._controller.supportsExecutionOrder = true;
    this._controller.executeHandler = this._executeAll.bind(this);
  }

  dispose(): void {
		this._controller.dispose();
	}

  private _executeAll(cells: vscode.NotebookCell[], _notebook: vscode.NotebookDocument, _controller: vscode.NotebookController): void {
		for (let cell of cells) {
			this._doExecution(cell);
		}
	}

  private async _doExecution(cell: vscode.NotebookCell): Promise<void> {
    const execution = this._controller.createNotebookCellExecution(cell);

    execution.executionOrder = ++this._executionOrder;
    execution.start(Date.now());

    try {
      execution.replaceOutput([new vscode.NotebookCellOutput([
        vscode.NotebookCellOutputItem.json(JSON.parse(cell.document.getText()), "<%- rendererMimeTypes[0] %>"),
        vscode.NotebookCellOutputItem.json(JSON.parse(cell.document.getText()))
      ])]);

      execution.end(true, Date.now());
    } catch (err) {
      execution.replaceOutput([new vscode.NotebookCellOutput([
        vscode.NotebookCellOutputItem.error(err)
      ])]);
      execution.end(false, Date.now());
    }
  }
}