"use strict";
const path = require('path');
const helpers = require('yeoman-test');
const spawn = require('execa');

const env = require('../generators/app/env');
const assert = require('assert');

describe('integration tests', function () {
    this.timeout(90000);

    it('command-ts integration test (install, compile and run extension tests)', function (done) {

        helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-ts',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm'
        }).toPromise().then(runResult => {
            try {
                //console.log('command-ts with test: Running npm install');
                const res = spawn.sync('npm', ['i'], { cwd: runResult.env.cwd });
                if (res.exitCode !== 0) {
                    assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
                }

                //console.log('command-ts with test: Running extension compile');
                const res2 = spawn.sync('npm', ['run', 'test'], { cwd: runResult.env.cwd });
                if (res2.exitCode !== 0) {
                    assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
                }
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('command-ts-webpack integration test (install, pack and run extension tests)', function (done) {

        helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-ts',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm',
            webpack: true
        }).toPromise().then(runResult => {
            try {
                //console.log('command-ts-webpack with test: Running npm install');
                const res = spawn.sync('npm', ['i'], { cwd: runResult.env.cwd });
                if (res.exitCode !== 0) {
                    assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
                }

                //console.log('command-ts-webpack with test: Running extension compile');
                const res2 = spawn.sync('npm', ['run', 'test'], { cwd: runResult.env.cwd });
                if (res2.exitCode !== 0) {
                    assert.fail(`npm run compile failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
                } else {

                }
                done();
            } catch (e) {
                done(e);
            }
        });
    });

    it('command-ts-web integration test (install, pack and run extension tests)', function (done) {

        helpers.run(path.join(__dirname, '../generators/app')).withPrompts({
            type: 'ext-command-web',
            name: 'testCom',
            displayName: 'Test Com',
            description: 'My TestCom',
            gitInit: false,
            pkgManager: 'npm'
        }).toPromise().then(runResult => {
            try {
                //console.log('command-ts-web with test: Running npm install');
                const res = spawn.sync('npm', ['i'], { cwd: runResult.env.cwd });
                if (res.exitCode !== 0) {
                    assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
                }

                //console.log('command-ts-web with test: Running extension compile-web');
                const res2 = spawn.sync('npm', ['run', 'test'], { cwd: runResult.env.cwd });
                if (res2.exitCode !== 0) {
                    assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
                } else {

                }
                done();
            } catch (e) {
                done(e);
            }
        });
    });
});
