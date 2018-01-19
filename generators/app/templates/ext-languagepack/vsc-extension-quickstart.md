# Welcome to the <%= lpLanguageName %> Language Pack

## What's in the folder
* `package.json` - dthe manifest file, defining the name and description of the language pack extension. It also contains the `languagePack` contribution point that defines the language id:
```json
        "contributes": {
            "languagePack": {
                "languageId": <%- JSON.stringify(lpLanguageId) %>
            }
        }
```
* `translations` - the folder containing the translation strings

To populate or update the `translations` folder with the latest strings from transifex:
- Get an API token from https://www.transifex.com/user/settings/api
- Set the API token to the environment variable `TRANSIFEX_API_TOKEN`
- Run `npm run update`
