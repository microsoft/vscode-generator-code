/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { rendererId, renderCallback } from '../common/constants';
import { render } from './render';
import errorOverlay from 'vscode-notebook-error-overlay';

// ----------------------------------------------------------------------------
// This is the entrypoint to the notebook renderer's webview client-side code.
// This contains some boilerplate that calls the `render()` function when new
// output is available. You probably don't need to change this code; put your
// rendering logic inside of the `render()` function.
// ----------------------------------------------------------------------------

const notebookApi = acquireNotebookRendererApi(rendererId);

// You can listen to an event that will fire right before cells unmount if
// you need to do teardown:
notebookApi.onWillDestroyOutput((cellUri) => {
  console.log(cellUri ? `Cell ${cellUri} will unmount` : 'All cells will be cleared');
});

notebookApi.onDidCreateOutput(({ element }) => renderTag(element.querySelector('script')!));

// Function to render your contents in a single tag, calls the `render()`
// function from render.ts. Also catches and displays any thrown errors.
const renderTag = (tag: HTMLScriptElement) =>
  errorOverlay.wrap(tag.parentElement, () => {
    let container: HTMLElement;

    // Create an element to render in, or reuse a previous element.
    const maybeOldContainer = tag.previousElementSibling;
    if (maybeOldContainer instanceof HTMLDivElement && maybeOldContainer.dataset.renderer) {
      container = maybeOldContainer;
      container.innerHTML = '';
    } else {
      container = document.createElement('div');
      tag.parentNode?.insertBefore(container, tag.nextSibling);
    }

    const mimeType = tag.dataset.mimeType as string;
    render({ container, mimeType, data: JSON.parse(tag.innerHTML), notebookApi });
  });

const renderAllTags = () => {
  const nodeList = document.querySelectorAll(`script[data-renderer="${rendererId}"]`);
  for (let i = 0; i < nodeList.length; i++) {
    renderTag(nodeList[i] as HTMLScriptElement);
  }
};

// Fix the public path so that any async import()'s work as expected.
declare let __webpack_public_path__: string;
declare let __webpack_relative_entrypoint_to_root__: string;

const getPublicPath = () => {
  // important: do not move this out of your entrypoint --
  // document.currentScript needs to be called synchronously.
  const currentDirname = (document.currentScript as HTMLScriptElement).src.replace(/[^/]+$/, '');
  return new URL(currentDirname + __webpack_relative_entrypoint_to_root__).toString();
};

__webpack_public_path__ = getPublicPath();

renderAllTags();

// When the module is hot-reloaded, rerender all tags. Webpack will update
// update the `render` function we imported, so we just need to call it again.
if (module.hot) {
  // note: using `module.hot?.accept` breaks HMR in Webpack 4--they parse
  // for specific syntax in the module.
  module.hot.accept(['./render'], renderAllTags);
}
