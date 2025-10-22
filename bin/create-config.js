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
// eslint-disable-next-line n/no-unsupported-features/node-builtins -- Using built-in parseArgs
import { parseArgs } from "node:util";

const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

const VERSION_TEXT = `v${pkg.version}`;
const HELP_TEXT = `
Usage: ${pkg.name} [options]

Options:
  --config [String]   Specify shareable config that is hosted on npm
  --eslintrc          Use an eslintrc-style (legacy) shared config
  -h, --help          Show help
  -v, --version       Show version
`.trim();

const { values: argv } = parseArgs({
    options: {
        config: {
            type: "string"
        },
        eslintrc: {
            type: "boolean"
        },
        help: {
            type: "boolean",
            short: "h"
        },
        version: {
            type: "boolean",
            short: "v"
        }
    },
    args: process.argv,
    strict: false
});

/* eslint-disable n/no-process-exit, no-console -- show help & version menu */

if (argv.help) {
    console.log(HELP_TEXT);
    process.exit(0);
}

if (argv.version) {
    console.log(VERSION_TEXT);
    process.exit(0);
}

/* eslint-enable -- enable again */

log.log(`${pkg.name}: ${VERSION_TEXT}`);

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
    throw new Error("A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.");
}

if (!argv.config) {
    const generator = new ConfigGenerator({ cwd, packageJsonPath });

    await generator.prompt();
    await generator.calc();
    await generator.output();
} else {

    // passed "--config"
    const packageName = argv.config;
    const type = argv.eslintrc ? "eslintrc" : "flat";
    const answers = { config: { packageName, type } };
    const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

    await generator.calc();
    await generator.output();
}
