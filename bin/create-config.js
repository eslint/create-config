#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import { info, error } from "../lib/utils/logging.js";
import process from "node:process";
import fs from "node:fs/promises";
import color from "ansi-colors";

const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));

info(`${pkg.name}: v${pkg.version}\n`);

const cwd = process.cwd();
const packageJsonPath = findPackageJson(cwd);

if (packageJsonPath === null) {
    throw new Error("A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.");
}

/**
 * Used for handle exit & error and show exit message.
 * @param {string} message Message to show.
 * @returns {void}
 */
function gracefullyExit(message) {
    error(color.magenta(color.symbols.cross), color.bold(message));
    /* eslint-disable-next-line n/no-process-exit -- exit gracefully */
    process.exit(1);
}

process.on("uncaughtException", err => {
    if (err instanceof Error && err.toString() === "Error [ERR_USE_AFTER_CLOSE]: readline was closed") {
        gracefullyExit("Operation Cancelled.");
    } else {
        gracefullyExit(err.message || err);
    }
});

const argv = process.argv;
const sharedConfigIndex = process.argv.indexOf("--config");

if (sharedConfigIndex === -1) {
    const generator = new ConfigGenerator({ cwd, packageJsonPath });

    (async () => {

        // TODO: this is right?
        try {
            await generator.prompt();
            await generator.calc();
            await generator.output();
        } catch (err) {
            gracefullyExit(err.message || err);
        }
    })();
} else {

    // passed "--config"
    const packageName = argv[sharedConfigIndex + 1];
    const type = argv.includes("--eslintrc") ? "eslintrc" : "flat";
    const answers = { config: { packageName, type } };
    const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

    (async () => {
        try {
            await generator.calc();
            await generator.output();
        } catch (err) {
            gracefullyExit(err.message || err);
        }
    })();
}
