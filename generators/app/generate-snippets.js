/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

const prompts = require("./prompts");
const path = require('path');
const fs = require('fs');
const plistParser = require('fast-plist');

module.exports = {
    id: 'ext-snippets',
    name: 'New Code Snippets',
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    prompting: async (generator, extensionConfig) => {
        await askForSnippetsInfo(generator, extensionConfig);

        await prompts.askForExtensionDisplayName(generator, extensionConfig);
        await prompts.askForExtensionId(generator, extensionConfig);
        await prompts.askForExtensionDescription(generator, extensionConfig);

        await askForSnippetLanguage(generator, extensionConfig);
        await prompts.askForGit(generator, extensionConfig);

    },
    /**
     * @param {import('yeoman-generator')} generator
     * @param {Object} extensionConfig
     */
    writing: (generator, extensionConfig) => {
        generator.fs.copy(generator.sourceRoot() + '/vscode', extensionConfig.name + '/.vscode');
        generator.fs.copyTpl(generator.sourceRoot() + '/package.json', extensionConfig.name + '/package.json', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/vsc-extension-quickstart.md', extensionConfig.name + '/vsc-extension-quickstart.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/README.md', extensionConfig.name + '/README.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/CHANGELOG.md', extensionConfig.name + '/CHANGELOG.md', extensionConfig);
        generator.fs.copyTpl(generator.sourceRoot() + '/snippets/snippets.code-snippets', extensionConfig.name + '/snippets/snippets.code-snippets', extensionConfig);
        generator.fs.copy(generator.sourceRoot() + '/vscodeignore', extensionConfig.name + '/.vscodeignore');
        if (extensionConfig.gitInit) {
            generator.fs.copy(generator.sourceRoot() + '/gitignore', extensionConfig.name + '/.gitignore');
            generator.fs.copy(generator.sourceRoot() + '/gitattributes', extensionConfig.name + '/.gitattributes');
        }
    }
}
/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForSnippetsInfo(generator, extensionConfig) {
    extensionConfig.isCustomization = true;
    let snippetFolderParam = generator.options['snippetFolder'] || generator.options['extensionParam'];

    if (snippetFolderParam) {
        let count = processSnippetFolder(snippetFolderParam, generator);
        if (count <= 0) {
            generator.log('')
        }
        return Promise.resolve();
    }
    generator.log("Folder location that contains Text Mate (.tmSnippet) and Sublime snippets (.sublime-snippet) or press ENTER to start with a new snippet file.");

    let snippetPrompt = () => {
        return generator.prompt({
            type: 'input',
            name: 'snippetPath',
            message: 'Folder name for import or none for new:',
            default: ''
        }).then(snippetAnswer => {
            let count = 0;
            let snippetPath = snippetAnswer.snippetPath;

            if (typeof snippetPath === 'string' && snippetPath.length > 0) {
                const count = processSnippetFolder(snippetPath, generator);
                if (count <= 0) {
                    return snippetPrompt();
                }
            } else {
                extensionConfig.snippets = {};
                extensionConfig.languageId = null;
            }

            if (count < 0) {
                return snippetPrompt();
            }
        });
    };
    return snippetPrompt();
}

/**
 * @param {import('yeoman-generator')} generator
 * @param {Object} extensionConfig
 */
function askForSnippetLanguage(generator, extensionConfig) {
    let snippetLanguage = generator.options['snippetLanguage'] || generator.options['extensionParam2'];

    if (snippetLanguage) {
        extensionConfig.languageId = snippetLanguage;
        return Promise.resolve();
    }

    generator.log('Enter the language for which the snippets should appear. The id is an identifier and is single, lower-case name such as \'php\', \'javascript\'');
    return generator.prompt({
        type: 'input',
        name: 'languageId',
        message: 'Language id:',
        default: extensionConfig.languageId
    }).then(idAnswer => {
        extensionConfig.languageId = idAnswer.languageId;
    });
}

function processSnippetFolder(folderPath, generator) {
    var errors = [], snippets = {};
    var snippetCount = 0;
    var languageId = null;

    var count = convert(folderPath);
    if (count <= 0) {
        generator.log("No valid snippets found in " + folderPath + (errors.length > 0 ? '.\n' + errors.join('\n') : ''));
        return count;
    }
    generator.extensionConfig.snippets = snippets;
    generator.extensionConfig.languageId = languageId;
    generator.log(count + " snippet(s) found and converted." + (errors.length > 0 ? '\n\nProblems while converting: \n' + errors.join('\n') : ''));
    return count;

    function convert(folderPath) {

        var files = getFolderContent(folderPath, errors);
        if (errors.length > 0) {
            return -1;
        }

        files.forEach(function (fileName) {
            var extension = path.extname(fileName).toLowerCase();
            var snippet;
            if (extension === '.tmsnippet') {
                snippet = convertTextMate(path.join(folderPath, fileName));
            } else if (extension === '.sublime-snippet') {
                snippet = convertSublime(path.join(folderPath, fileName));
            }
            if (snippet) {
                if (snippet.prefix && snippet.body) {
                    snippets[getId(snippet.prefix)] = snippet;
                    snippetCount++;
                    guessLanguage(snippet.scope);
                } else {
                    var filePath = path.join(folderPath, fileName);
                    if (!snippet.prefix) {
                        errors.push(filePath + ": Missing property 'tabTrigger'. Snippet skipped.");
                    } else {
                        errors.push(filePath + ": Missing property 'content'. Snippet skipped.");
                    }
                }
            }

        });
        return snippetCount;
    }


    function getId(prefix) {
        if (snippets.hasOwnProperty(prefix)) {
            var counter = 1;
            while (snippets.hasOwnProperty(prefix + counter)) {
                counter++;
            }
            return prefix + counter;
        }
        return prefix;
    }

    function guessLanguage(scopeName) {
        if (!languageId && scopeName) {
            var match;
            if (match = /(source|text)\.(\w+)/.exec(scopeName)) {
                languageId = match[2];
            }
        }
    }

    function convertTextMate(filePath) {
        var body = getFileContent(filePath, errors);
        if (!body) {
            return;
        }
        var value;
        try {
            value = plistParser.parse(body);
        } catch (e) {
            generator.log(filePath + " not be parsed: " + e.toString());
            return undefined;
        }
        if (!value) {
            generator.log(filePath + " not be parsed. Make sure it is a valid plist file. ");
            return undefined;
        }

        return {
            prefix: value.tabTrigger,
            body: value.content,
            description: value.name,
            scope: value.scope
        }
    }

    function convertSublime(filePath) {
        var body = getFileContent(filePath, errors);
        if (!body) {
            return;
        }

        var parsed = plistParser.parse(body);

        var snippet = {
            prefix: parsed['tabtrigger'],
            body: parsed['content'],
            description: parsed['description'],
            scope: parsed['scope']
        };

        return snippet;
    }


}

function getFolderContent(folderPath, errors) {
    try {
        return fs.readdirSync(folderPath);
    } catch (e) {
        errors.push("Unable to access " + folderPath + ": " + e.message);
        return [];
    }
}

function getFileContent(filePath, errors) {
    try {
        var content = fs.readFileSync(filePath).toString();
        if (content === '') {
            errors.push(filePath + ": Empty file content");
        }
        return content;
    } catch (e) {
        errors.push(filePath + ": Problems loading file content: " + e.message);
        return null;
    }
}

function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile()
    } catch (e) {
        return false;
    }
}
