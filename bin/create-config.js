#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import * as log from "../lib/utils/logging.js";
import process from "node:process";
import fs from "node:fs/promises";

const pkg = JSON.parse(
	await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
);

log.log(`${pkg.name}: v${pkg.version}\n`);

process.on("uncaughtException", error => {
	if (error instanceof Error && error.code === "ERR_USE_AFTER_CLOSE") {
		log.error("Operation canceled");
		// eslint-disable-next-line n/no-process-exit -- exit gracefully on Ctrl+C
		process.exit(1);
	} else {
		throw error;
	}
});

const cwd = process.cwd();
const packageJsonPath = findPackageJson(cwd);

if (packageJsonPath === null) {
	throw new Error(
		"A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.",
	);
}

const argv = process.argv;
const sharedConfigIndex = process.argv.indexOf("--config");

if (sharedConfigIndex === -1) {
	const generator = new ConfigGenerator({ cwd, packageJsonPath });

	await generator.prompt();
	await generator.calc();
	await generator.output();
} else {
	// passed "--config"
	const packageName = argv[sharedConfigIndex + 1];
	const type = argv.includes("--eslintrc") ? "eslintrc" : "flat";
	const answers = { config: { packageName, type } };
	const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

	await generator.calc();
	await generator.output();
}
