#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { PromptCancelError } from "../lib/prompt.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import pkg from "../package.json" with { type: "json" };
import { intro, log } from "@clack/prompts";
import process from "node:process";
import { parseArgs } from "node:util";

/**
 * Runs the CLI.
 * @returns {Promise<void>}
 */
async function init() {
	const cwd = process.cwd();
	const args = process.argv.slice(2);

	intro(`${pkg.name}: v${pkg.version}`);

	const { values } = parseArgs({
		options: {
			config: {
				type: "string",
			},
			eslintrc: {
				type: "boolean",
			},
		},
		args,
	});

	const packageJsonPath = findPackageJson(cwd);

	if (!packageJsonPath) {
		throw new Error(
			"A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.",
		);
	}

	if (values.config) {
		const packageName = values.config;
		const type = values.eslintrc ? "eslintrc" : "flat";
		const answers = { config: { packageName, type } };
		const generator = new ConfigGenerator({
			cwd,
			packageJsonPath,
			answers,
		});

		await generator.calc();
		await generator.output();
	} else {
		const generator = new ConfigGenerator({ cwd, packageJsonPath });

		await generator.prompt();
		await generator.calc();
		await generator.output();
	}
}

init().catch(error => {
	if (error instanceof PromptCancelError) {
		// eslint-disable-next-line n/no-process-exit -- exit gracefully on prompt cancellation
		process.exit(0);
	}
	log.error(error instanceof Error ? error.message : String(error));
	// eslint-disable-next-line n/no-process-exit -- exit gracefully on an unexpected error
	process.exit(1);
});
