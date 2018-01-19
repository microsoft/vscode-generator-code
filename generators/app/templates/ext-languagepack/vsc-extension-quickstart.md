# Welcome to your VS Code Language Pack

## What's in the folder
* This folder contains all of the files necessary for a language pack.
* `package.json` - this is the manifest file. It defines the name and description of the extension.
The `languagePack` contribution point defines the language id
```json
        "contributes": {
            "languagePack": {
                "languageId": <%- JSON.stringify(lpLanguageId) %>
            }
        }
```
* `translations`: The folder containing the translation strings

To populate or update the `translations` folder with the latest strings from transifex:
- Get an API token from https://www.transifex.com/user/settings/api
- Set the API token to the environment variable `TRANSIFEX_API_TOKEN`
- run `npm run update`
