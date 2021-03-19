require('mocha/mocha'); // this defines the global 'mocha'

export function run(): Promise<void> {

	return new Promise((c, e) => {
		mocha.setup({
			ui: 'tdd',
			reporter: undefined,
		});

		// fina and bundles all files in the current directory matching `*.test`
		const importAll = (r: __WebpackModuleApi.RequireContext) => r.keys().forEach(r);
		importAll(require.context('.', true, /\.test$/));

		try {
			// Run the mocha test
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
