"use strict";
const path = require('path');
const helpers = require('yeoman-test');
const spawn = require('execa');

const assert = require('assert');

describe('integration tests', function () {
    this.timeout(120000);

    it('command-ts integration test (install, compile and run extension tests)', async () => {

        const runResult = await helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-ts',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm',
            openWith: 'skip'
        }).toPromise();

        //console.log('command-ts with test: Running npm install');
        const res = await doSpawn('npm', ['i'], { cwd: runResult.env.cwd });
        if (res.exitCode !== 0) {
            assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
        }

        const resAudit = await doSpawn('npm', ['audit'], { cwd: runResult.env.cwd });
        if (resAudit.exitCode !== 0) {
            assert.fail(`npm audit failed: stdout ${resAudit.stdout} stderr ${resAudit.stderr}`);
        }

        //console.log('command-ts with test: Running extension compile');
        const res2 = await doSpawn('npm', ['run', 'test'], { cwd: runResult.env.cwd });
        if (res2.exitCode !== 0) {
            assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
        }

        runResult.assertFile('testCom/out/extension.js');
        runResult.assertFile('testCom/out/test/suite/index.js');
        runResult.assertFile('testCom/out/test/runTest.js');
    });

    it('command-ts-webpack integration test (install, pack and run extension tests)', async () => {

        const runResult = await helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-ts',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm',
            webpack: true,
            openWith: 'skip'
        }).toPromise();

        const res = await doSpawn('npm', ['i'], { cwd: runResult.env.cwd });
        if (res.exitCode !== 0) {
            assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
        }

        const resAudit = await doSpawn('npm', ['audit'], { cwd: runResult.env.cwd });
        if (resAudit.exitCode !== 0) {
            assert.fail(`npm audit failed: stdout ${resAudit.stdout} stderr ${resAudit.stderr}`);
        }

        //console.log('command-ts-webpack with test: Running extension compile');
        const res2 = await doSpawn('npm', ['run', 'test'], { cwd: runResult.env.cwd });
        if (res2.exitCode !== 0) {
            assert.fail(`npm run compile failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
        }

        runResult.assertFile('testCom/dist/extension.js');
        runResult.assertFile('testCom/out/test/suite/index.js');
        runResult.assertFile('testCom/out/test/runTest.js');
    });

    it('command-ts-web integration test (install, pack and run extension tests)', async () => {

        const runResult = await helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-web',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm',
            openWith: 'skip'
        }).toPromise();

        const res = await doSpawn('npm', ['i'], { cwd: runResult.env.cwd });
        if (res.exitCode !== 0) {
            assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
        }

        const resAudit = await doSpawn('npm', ['audit'], { cwd: runResult.env.cwd });
        if (resAudit.exitCode !== 0) {
            assert.fail(`npm audit failed: stdout ${resAudit.stdout} stderr ${resAudit.stderr}`);
        }

        //console.log('command-ts-web with test: Running extension compile-web');
        const res2 = await doSpawn('npm', ['run', 'test'], { cwd: runResult.env.cwd });
        if (res2.exitCode !== 0) {
            assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
        }

        runResult.assertFile('testCom/dist/web/extension.js');
        runResult.assertFile('testCom/dist/web/test/suite/index.js');
    });
});

async function doSpawn(execName, allArguments, options,) {
    const resAudit = spawn(execName, allArguments, options)
    resAudit.stdout.pipe(process.stdout);
    resAudit.stderr.pipe(process.stderr);
    return await resAudit;
}
