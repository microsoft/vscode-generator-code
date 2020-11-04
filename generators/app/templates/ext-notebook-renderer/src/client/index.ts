/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { render } from './render';
import errorOverlay from 'vscode-notebook-error-overlay';
import { NotebookOutputEventParams } from 'vscode-notebook-renderer';

// ----------------------------------------------------------------------------
// This is the entrypoint to the notebook renderer's webview client-side code.
// This contains some boilerplate that calls the `render()` function when new
// output is available. You probably don't need to change this code; put your
// rendering logic inside of the `render()` function.
// ----------------------------------------------------------------------------

const notebookApi = acquireNotebookRendererApi(<%- JSON.stringify(rendererId) %>);

// Track cells that we render so that, in development, we can re-render then
// when the scripts change.
const rendered = new Map<string, NotebookOutputEventParams>();

// You can listen to an event that will fire right before cells unmount if
// you need to do teardown:
notebookApi.onWillDestroyOutput((evt) => {
  if (evt) {
    rendered.delete(evt.outputId);
  } else {
    rendered.clear();
  }
});

notebookApi.onDidCreateOutput((evt) => {
  rendered.set(evt.outputId, evt);
  renderTag(evt);
});

// Function to render your contents in a single tag, calls the `render()`
// function from render.ts. Also catches and displays any thrown errors.
const renderTag = ({ element, mimeType, output }: NotebookOutputEventParams) =>
  errorOverlay.wrap(element, () => {
    element.innerHTML = '';
    const node = document.createElement('div');
    element.appendChild(node);

    render({ container: node, mimeType, data: output.data[mimeType], notebookApi });
  });

function renderAllTags() {
  for (const evt of rendered.values()) {
    renderTag(evt);
  }
}

// Fix the public path so that any async import()'s work as expected.
declare let __webpack_public_path__: string;
declare let __webpack_relative_entrypoint_to_root__: string;
declare const scriptUrl: string;

__webpack_public_path__ = new URL(scriptUrl.replace(/[^/]+$/, '') + __webpack_relative_entrypoint_to_root__).toString();

renderAllTags();

// When the module is hot-reloaded, rerender all tags. Webpack will update
// update the `render` function we imported, so we just need to call it again.
if (module.hot) {
  // note: using `module.hot?.accept` breaks HMR in Webpack 4--they parse
  // for specific syntax in the module.
  module.hot.accept(['./render'], renderAllTags);
}
