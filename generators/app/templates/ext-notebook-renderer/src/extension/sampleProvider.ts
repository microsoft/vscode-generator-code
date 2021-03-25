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
   public async dataToNotebook(data: Uint8Array): Promise<vscode.NotebookData> {
    var contents = new TextDecoder().decode(data);

    let raw: RawNotebookData = { cells: [] };
    try {
      raw = <RawNotebookData>JSON.parse(contents);
    } catch {
      raw = { cells: []};
    }

    if(raw.cells === undefined) {
      raw.cells = [];
    }

    const cells = raw.cells.map(item => new vscode.NotebookCellData(
      item.kind,
      item.value,
      item.language,
      item.outputs ? [new vscode.NotebookCellOutput(item.outputs.map(raw => new vscode.NotebookCellOutputItem(raw.mime, raw.value)))] : [],
      new vscode.NotebookCellMetadata().with({ editable: item.editable ?? true })
    ));

    return new vscode.NotebookData(
      cells,
      new vscode.NotebookDocumentMetadata().with({ cellHasExecutionOrder: true, })
    );
  }

  /**
   * @inheritdoc
   */
   public async notebookToData(data: vscode.NotebookData): Promise<Uint8Array> {
    function asRawOutput(cell: vscode.NotebookCellData): RawCellOutput[] {
      let result: RawCellOutput[] = [];
      for (let output of cell.outputs ?? []) {
        for (let item of output.outputs) {
          result.push({ mime: item.mime, value: item.value });
        }
      }
      return result;
    }

    let contents: RawNotebookData = { cells: []};

    for (const cell of data.cells) {
      contents.cells.push({
        kind: cell.kind,
        language: cell.language,
        value: cell.source,
        editable: cell.metadata?.editable,
        outputs: asRawOutput(cell)
      });
    }

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
