#!/usr/bin/env node
/**
 * Launcher script to run the vscode-generator-code
 * Usage: node run-generator.mjs [options]
 */

import { createEnv } from 'yeoman-environment';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runGenerator() {
	try {
		const env = createEnv();
		const appPath = path.join(__dirname, 'generators', 'app');

		// Register the local generator
		env.register(appPath, 'code:app');

		// Run the generator
		await env.run('code:app');
	} catch (error) {
		console.error('Error running generator:', error.message);
		process.exit(1);
	}
}

runGenerator();
