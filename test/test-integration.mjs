/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as path from 'path';
import { createHelpers } from 'yeoman-test';
import * as cp from 'child_process';

import * as assert from 'assert';

import { fileURLToPath } from 'url';

describe('integration tests', function () {
	this.timeout(7 * 60 * 1000);

	const helpers = createHelpers();
	const appLocation = path.join(fileURLToPath(import.meta.url), '../../generators/app');

	const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

	async function checkAudit(cwd) {

		const resAudit = await doSpawn(npmCommand, ['audit'], { cwd: cwd, shell: true });
		if (resAudit.exitCode !== 0) {
			if (resAudit.stdout.indexOf('https://github.com/advisories/GHSA-73rr-hh4g-fpgx') === -1) { // diff vulnerability
				assert.fail(`npm audit failed: stdout ${resAudit.stdout} stderr ${resAudit.stderr}`);
			} else {
				console.warn('npm audit vulnerability for `diff` ignored for now, waiting for a mocha update');
			}
		}
	}

	it('command-ts integration test (install, compile and run extension tests)', async () => {

		const runResult = await helpers.run(appLocation).withAnswers({
			type: 'ext-command-ts',
			name: 'testCom',
			displayName: 'Test Com',
			description: 'My TestCom',
			gitInit: false,
			pkgManager: 'npm',
			bundler: 'unbundled',
			openWith: 'skip'
		});

		//console.log('command-ts with test: Running npm install');
		const res = await doSpawn(npmCommand, ['i'], { cwd: runResult.env.cwd, shell: true });
		if (res.exitCode !== 0) {
			assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
		}

		await checkAudit(runResult.env.cwd);

		//console.log('command-ts with test: Running extension compile');
		const res2 = await doSpawn(npmCommand, ['run', 'test'], { cwd: runResult.env.cwd, shell: true });
		if (res2.exitCode !== 0) {
			assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
		}

		runResult.assertFile('testCom/out/extension.js');
		runResult.assertFile('testCom/out/test/extension.test.js');
	});

	it('command-ts-webpack integration test (install, pack and run extension tests)', async () => {

		const runResult = await helpers.run(appLocation).withAnswers({
			type: 'ext-command-ts',
			name: 'testCom',
			displayName: 'Test Com',
			description: 'My TestCom',
			gitInit: false,
			pkgManager: 'npm',
			bundler: 'webpack',
			openWith: 'skip'
		});

		const res = await doSpawn(npmCommand, ['i'], { cwd: runResult.env.cwd, shell: true });
		if (res.exitCode !== 0) {
			assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
		}

		await checkAudit(runResult.env.cwd);

		//console.log('command-ts-webpack with test: Running extension compile');
		const res2 = await doSpawn(npmCommand, ['run', 'test'], { cwd: runResult.env.cwd, shell: true });
		if (res2.exitCode !== 0) {
			assert.fail(`npm run compile failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
		}

		runResult.assertFile('testCom/dist/extension.js');
		runResult.assertFile('testCom/out/test/extension.test.js');
	});

	it('command-ts-esbuild integration test (install, pack and run extension tests)', async () => {

		const runResult = await helpers.run(appLocation).withAnswers({
			type: 'ext-command-ts',
			name: 'testCom',
			displayName: 'Test Com',
			description: 'My TestCom',
			gitInit: false,
			pkgManager: 'npm',
			bundler: 'esbuild',
			openWith: 'skip'
		});

		const res = await doSpawn(npmCommand, ['i'], { cwd: runResult.env.cwd, shell: true });
		if (res.exitCode !== 0) {
			assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
		}

		await checkAudit(runResult.env.cwd);

		//console.log('command-ts-esbuild with test: Running extension compile');
		const res2 = await doSpawn(npmCommand, ['run', 'test'], { cwd: runResult.env.cwd, shell: true });
		if (res2.exitCode !== 0) {
			assert.fail(`npm run compile failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
		}

		runResult.assertFile('testCom/dist/extension.js');
		runResult.assertFile('testCom/out/test/extension.test.js');
	});

	it('command-ts-web-webpack integration test (install, pack and run extension tests)', async () => {

		const runResult = await helpers.run(appLocation).withAnswers({
			type: 'ext-command-web',
			name: 'testCom',
			displayName: 'Test Com',
			description: 'My TestCom',
			gitInit: false,
			pkgManager: 'npm',
			bundler: 'webpack',
			openWith: 'skip'
		});

		const res = await doSpawn(npmCommand, ['i'], { cwd: runResult.env.cwd, shell: true });
		if (res.exitCode !== 0) {
			assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
		}

		await checkAudit(runResult.env.cwd);

		//console.log('command-ts-web with test: Running extension compile-web');
		const res2 = await doSpawn(npmCommand, ['run', 'test'], { cwd: runResult.env.cwd, shell: true });
		if (res2.exitCode !== 0) {
			assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
		}

		runResult.assertFile('testCom/dist/web/extension.js');
		runResult.assertFile('testCom/dist/web/test/suite/index.js');
	});

	it('command-ts-web-esbuild integration test (install, pack and run extension tests)', async () => {

		const runResult = await helpers.run(appLocation).withAnswers({
			type: 'ext-command-web',
			name: 'testCom',
			displayName: 'Test Com',
			description: 'My TestCom',
			gitInit: false,
			pkgManager: 'npm',
			bundler: 'esbuild',
			openWith: 'skip'
		});

		const res = await doSpawn(npmCommand, ['i'], { cwd: runResult.env.cwd, shell: true });
		if (res.exitCode !== 0) {
			assert.fail(`npm installed failed: stdout ${res.stdout} stderr ${res.stderr}`);
		}

		await checkAudit(runResult.env.cwd);

		//console.log('command-ts-web with test: Running extension compile-web');
		const res2 = await doSpawn(npmCommand, ['run', 'test'], { cwd: runResult.env.cwd, shell: true });
		if (res2.exitCode !== 0) {
			assert.fail(`npm run test failed: stdout ${res2.stdout} stderr ${res2.stderr}`);
		}

		runResult.assertFile('testCom/dist/web/extension.js');
		runResult.assertFile('testCom/dist/web/test/suite/extensionTests.js');
	});
});

async function doSpawn(execName, allArguments, options) {
	return new Promise((resolve, reject) => {
		const child = cp.execFile(execName, allArguments, { stdio: 'pipe', ...options });
		let stdout = [], stderr = [];
		child.stdout.on('data', (data) => {
			stdout.push(data.toString());
		});
		child.stderr.on('data', (data) => {
			stderr.push(data.toString());
		});
		child.on('error', (err) => {
			reject(err);
		});
		child.on('exit', (exitCode) => {
			resolve({ exitCode, stdout: stdout.join(''), stderr: stderr.join('') });
		});
	});
}

