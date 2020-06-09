# Yo Code - Extension and Customization Generator

[![Build Status](https://dev.azure.com/ms/vscode-generator-code/_apis/build/status/Microsoft.vscode-generator-code)](https://dev.azure.com/ms/vscode-generator-code/_build/latest?definitionId=17)

We have written a Yeoman generator to help get you started. We plan to add templates for most extension/customization types into this.

## Install the Generator

Install Yeoman and the VS Code Extension generator:

```bash
npm install -g yo generator-code
```

## Run Yo Code
The Yeoman generator will walk you through the steps required to create your customization or extension prompting for the required information.

To launch the generator simply type:

```bash
yo code
```

![The command generator](yocode.png)

## Generator Output

These templates will
* Create a base folder structure
* Template out a rough `package.json`
* Import any assets required for your extension e.g. tmBundles or the VS Code Library
* For Extensions: Set-up `launch.json` for running your extension and attaching to a process

## Run Generator using Docker
If you don't want to install nodejs or any node packages, use this method to containerize the generator. \
\
Go into your project directory
```bash
cd <project directory>
```
Build the docker image from the docker file
```bash
docker build -t vscode-generator-code .
```
Create a docker container with volumes
```bash
docker run -v $(pwd):/usr/src/app vscode-generator-code
```

## History

* 1.0.0: Generates a VS Code extension for TypeScript 2.0.3
* 0.10.x: Generates a VS Code extension for TypeScript 1.8.10

## License

[MIT](LICENSE)
