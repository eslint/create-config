#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import { info, error, warn } from "../lib/utils/logging.js";
import process from "node:process";
import semverSatisfies from "semver/functions/satisfies.js";
import colors from "ansi-colors";
import pkg from "../package.json" with {type:"json"};

info((colors.blueBright(`\n${pkg.name}: v${pkg.version}\n`)));

// Warn if your Node.js version is NOT compatible
const myNodeVersion = process.version.slice(1);
const compatibleVersionRange = pkg.engines.node;
const compatibleVersionRangeText = compatibleVersionRange.replace(/(\s)*/gu, "").replace(/\|\|/gu, ", or ");

if (!semverSatisfies(myNodeVersion, compatibleVersionRange)) {
    warn(`Need Node.js version ${compatibleVersionRangeText}. But your Node.js version is ${myNodeVersion}. Please upgrade your Node.js first.`);
    // eslint-disable-next-line n/no-process-exit -- Exit gracefully
    process.exit(0);
}

const cwd = process.cwd();
const packageJsonPath = findPackageJson(cwd);

if (packageJsonPath === null) {
    throw new Error("A package.json file is necessary to initialize ESLint. Please run `npm init` to create a package.json file and try again.");
}

const argv = process.argv;
const sharedConfigIndex = process.argv.indexOf("--config");

/**
 * Function to showing message when you close the prompts.
 * @returns {void}
 */
function operationCancelled() {
    error("Operation cancelled.");
    // eslint-disable-next-line n/no-process-exit -- Exit with error
    process.exit(1);
}

if (sharedConfigIndex === -1) {
    (async function() {
        const generator = new ConfigGenerator({ cwd, packageJsonPath });

        await generator.prompt().catch(() => operationCancelled());
        await generator.calc();
        await generator.output().catch(() => operationCancelled());
    }());
} else {
    (async function() {

        // passed "--config"
        const packageName = argv[sharedConfigIndex + 1];
        const type = argv.includes("--eslintrc") ? "eslintrc" : "flat";
        const answers = { config: { packageName, type } };
        const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

        await generator.calc();
        await generator.output().catch(() => operationCancelled());
    }());
}
