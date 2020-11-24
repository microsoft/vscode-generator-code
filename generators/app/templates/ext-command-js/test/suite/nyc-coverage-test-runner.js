const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');
const vscode = require('vscode');

// Based on
// - https://github.com/microsoft/vscode-docs/issues/1096#issuecomment-543850032
// - https://github.com/microsoft/vscode-js-debug/blob/master/src/test/testRunner.ts
// - https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/issues/224

// !!!
// !!! Coverage report will be empty with `*` as one of the `activationEvents` in `package.json`.
// !!!

function setupCoverage() {
	const NYC = require('nyc');
	const nyc = new NYC({
		cwd: path.join(__dirname, '..', '..'),
		exclude: ['**/test/**', '.vscode-test/**'],
		reporter: ['text', 'html'],
		all: true,
		instrument: true,
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
	});

	nyc.reset();
	nyc.wrap();

	return nyc;
}

async function run() {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
		color: true
	});

	const testsRoot = path.resolve(__dirname, '..');
	const nyc = process.env.COVERAGE === '1' ? setupCoverage() : null;
	const files = glob.sync('**/**.test.js', { cwd: testsRoot });

	console.error(`       process.env.COVERAGE: [${process.env.COVERAGE}]`);
	console.error(`   process.env.SELECT_SUITE: [${process.env.SELECT_SUITE}]`);
	console.error(`process.env.CUR_OPENED_FILE: [${process.env.CUR_OPENED_FILE}]`);
	console.error(`                  testsRoot: [${testsRoot}]`);

	let suites = [];

	if (process.env.SELECT_SUITE === '1') {
		let curOpenedFile = process.env.CUR_OPENED_FILE;
		if (curOpenedFile && !curOpenedFile.endsWith('.test')) {
			curOpenedFile = curOpenedFile + '.test';
		}

		console.error('Suites:');

		const items = files.map(file => {
			console.error('  - ' + file);

			const item = {
				label: file,
				picked: curOpenedFile ? file.includes(curOpenedFile) : false
			};

			return item;
		});

		const selected = await vscode.window.showQuickPick(items, {
			canPickMany: true,
			ignoreFocusOut: true,
			placeHolder: 'Pick a one or more test suites to run'
		});

		if (selected) {
			suites = selected.map(item => item.label);
		} else {
			suites = [];
		}

	} else {
		suites = files;
	}

	console.error('Selected:');

	for (const file of suites) {
		console.error('  - ' + file);
		mocha.addFile(path.resolve(testsRoot, file));
	}

	try {
		await new Promise((resolve, reject) => {
			mocha.run(failures =>
				failures ? reject(new Error(`${failures} tests failed`)) : resolve(),
			);
		});
	} catch (err) {
		console.error(err);
	} finally {
		if (nyc) {
			nyc.writeCoverageFile();
			await nyc.report();
		}
	}
}

module.exports = {
	run
};
