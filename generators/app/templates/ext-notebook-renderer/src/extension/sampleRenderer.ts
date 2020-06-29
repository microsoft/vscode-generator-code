import * as vscode from 'vscode';
import * as path from 'path';
import { rendererId } from '../common/constants';

export class SampleRenderer implements vscode.NotebookOutputRenderer {
  private hasOpenedDevTools = new WeakSet<vscode.NotebookDocument>();

  public readonly preloads: vscode.Uri[] = [];

  constructor(private readonly context: vscode.ExtensionContext) {
    // Set preloads to a list of scripts you want VS Code to load before your
    // renderer is ready. Here, we load the compiled Webpack bundle in 'release'
    // mode and load from the webpack-dev-server in development, which provides
    // hot reloading for easy development.
    const webpackDevServerPort = process.env.RENDERER_USE_WDS_PORT;
    if (webpackDevServerPort && context.extensionMode !== vscode.ExtensionMode.Production) {
      this.preloads.push(vscode.Uri.parse(`http://localhost:${webpackDevServerPort}/index.js`));
    } else {
      this.preloads.push(vscode.Uri.file(path.join(context.extensionPath, 'out/client/index.js')));
    }
  }

  /**
   * Called to render a cell.
   */
  public render(
    document: vscode.NotebookDocument,
    { output, mimeType }: vscode.NotebookRenderRequest,
  ): string {
    const renderData = output.data[mimeType];
    this.ensureDevTools(document);

    // Here we output a script tag that calls a function we exposed in the
    // renderer client in its `online`. Its contents are are output data as JSON.
    // You could also preprocess your data before passing it to the client.
    return `
      <script data-renderer="${rendererId}" data-mime-type="${mimeType}" type="application/json">
        ${JSON.stringify(renderData)}
      </script>
    `;
  }

  /**
   * This is called whenever we get a new editor for a notebook. Bear in mind
   * that you can have multiple editors (and webviews!) for a single notebook
   * if the user splits the frame.
   */
  public resolveNotebook(document: vscode.NotebookDocument, communication: vscode.NotebookCommunication) {
    // communication.onDidReceiveMessage is called whenever `postMessage` on
    // the notebook API is called in the webview.
    communication.onDidReceiveMessage(message => {
      // Here we will just echo the message back to the webview.
      communication.postMessage(message);
    });
  }

  /**
   * Little utility to open the webview dev tools on first render.
   * Todo: unnecessary once https://github.com/microsoft/vscode/issues/96626
   */
  private async ensureDevTools(document: vscode.NotebookDocument) {
    if (
      this.context.extensionMode === vscode.ExtensionMode.Development &&
      !this.hasOpenedDevTools.has(document)
    ) {
      await vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools');
      this.hasOpenedDevTools.add(document);
    }
  }
}
