# Welcome to your VS Code Extension

## What's in the folder
* This folder contains all of the files necessary for your color theme extension
* `package.json` - this is the manifest file that defines the location of the theme file
and specifies the base theme of the theme
* `themes/<%= themeFileName %>` - the color theme definition file

## Get up and running straight away
* press `F5` to open a new window with your extension loaded
* open `File > Preferences > Color Themes` and pick your color theme
* Open a file that has a language associated. The languages' configures grammar will tokenize the text and assign a `scopes' to the tokens. To examine these scope, invoke the `Inspect TM Scopes` command from the Commmand Palette (`Ctrl+Shift+P` or `Cmd+Shift+R` on Mac) .

## Make changes
* you can relaunch the extension from the debug toolbar after making changes to the files listed above
* you can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes
* When editing workbench colors, it's easier to test the colors first in the settings under `workbench.colorCustomizations`.

## Adopt your theme to Visual Studio Code
* The token colorization is done through standard TextMate themes. Colors are matched against or more scopes.
To learn about what scopes are used where, check out the [TextMate documentation](https://manual.macromates.com/en/themes)
and the [Scope Naming](https://www.sublimetext.com/docs/3/scope_naming.html) documentation from Sublime.
* A great place to examine themes is [here](https://tmtheme-editor.herokuapp.com/#!/editor/theme/Monokai).

## Install your extension
* To start using your extension with Visual Studio Code copy it into the `<user home>/.vscode/extensions` folder and restart Code.
* To share your extension with the world, read on https://code.visualstudio.com/docs about publishing an extension.
