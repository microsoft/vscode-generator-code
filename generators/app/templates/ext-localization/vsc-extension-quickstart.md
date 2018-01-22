# Welcome to the <%= lpLanguageName %> localization

## What's in the folder
* `package.json` - the manifest file, defining the name and description of the localization extension. It also contains the `localizations` contribution point that defines the language id and the location of the translations:
```json
        "contributes": {
            "localization": [{
                "languageId": <%- JSON.stringify(lpLanguageId) %>,
                "languageName": <%- JSON.stringify(lpLanguageName) %>,
                "translations": "./translations"
            }]
        }
```
* `translations` - the folder containing the translation strings



To populate or update the `translations` folder with the latest strings from transifex:
- the localization extension must be placed next to the vscode repository.
- Get an API token from https://www.transifex.com/user/settings/api.
- Set the API token to the environment variable `TRANSIFEX_API_TOKEN`.
- Run `npm run update`.
