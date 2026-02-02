#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import { intro, outro } from "@clack/prompts";
import process from "node:process";
import fs from "node:fs/promises";
import { parseArgs } from "node:util";

const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

let options;

try {
    const { values } = parseArgs({
        options: {
            config: {
                type: "string"
            },
            eslintrc: {
                type: "boolean"
            }
        },
        args: process.argv.slice(2)
    });

    options = values;
} catch (error) {
    // eslint-disable-next-line no-console -- show an error
    console.error("Error:", error.message);
    // eslint-disable-next-line n/no-process-exit -- exit gracefully on invalid arguments
    process.exit(1);
}

intro(`${pkg.name}: v${pkg.version}`);

const cwd = process.cwd();
const packageJsonPath = findPackageJson(cwd);

if (packageJsonPath === null) {
    throw new Error("A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.");
}

if (!options.config) {
    const generator = new ConfigGenerator({ cwd, packageJsonPath });

    await generator.prompt();
    await generator.calc();
    await generator.output();
} else {

    // passed "--config"
    const packageName = options.config;
    const type = options.eslintrc ? "eslintrc" : "flat";
    const answers = { config: { packageName, type } };
    const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

    await generator.calc();
    await generator.output();
}

outro("Thank you");
