import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from "util";

/**
 * An ultra-minimal sample provider that lets the user type in JSON, and then
 * outputs JSON cells.
 */

interface RawNotebookData {
  cells: RawNotebookCell[]
}

interface RawNotebookCell {
  language: string;
  value: string;
  kind: vscode.NotebookCellKind;
  editable?: boolean;
  outputs: RawCellOutput[];
}

interface RawCellOutput {
  mime: string;
  value: any;
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
      item.language,
      item.outputs ? [new vscode.NotebookCellOutput(item.outputs.map(raw => new vscode.NotebookCellOutputItem(raw.mime, raw.value)))] : [],
      new vscode.NotebookCellMetadata()
    ));

    // Pass read and formatted Notebook Data to VS Code to display Notebook with saved cells
    return new vscode.NotebookData(
      cells,
      new vscode.NotebookDocumentMetadata()
    );
  }

  /**
   * @inheritdoc
   */
  public async serializeNotebook(data: vscode.NotebookData, token: vscode.CancellationToken): Promise<Uint8Array> {
    // function to take output renderer data to a format to save to the file
    function asRawOutput(cell: vscode.NotebookCellData): RawCellOutput[] {
      let result: RawCellOutput[] = [];
      for (let output of cell.outputs ?? []) {
        for (let item of output.outputs) {
          result.push({ mime: item.mime, value: item.value });
        }
      }
      return result;
    }

    // Map the Notebook data into the format we want to save the Notebook data as
    let contents: RawNotebookData = { cells: []};

    for (const cell of data.cells) {
      contents.cells.push({
        kind: cell.kind,
        language: cell.language,
        value: cell.source,
        outputs: asRawOutput(cell)
      });
    }

    // Give a string of all the data to save and VS Code will handle the rest
    return new TextEncoder().encode(JSON.stringify(contents));
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
      for (let cell of document.getCells(range)) {
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
