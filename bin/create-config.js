#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import { findPackageJson } from "../lib/utils/npm-utils.js";
import { info, error, warn } from "../lib/utils/logging.js";
import process from "node:process";
import semverSatisfies from 'semver/functions/satisfies.js';
import colors from 'ansi-colors';
import pkg from '../package.json' with {type:'json'};

info((colors.blueBright(`\n${pkg.name}: v${pkg.version}\n`)));

Object.defineProperty(process, 'version', {value:'v11.0.4'})

// Warn if your Node.js version is NOT compatible
const myNodeVersion = process.version.substring(1);
const compatibleVersionRange = pkg.engines.node;
const compatibleVersionRangeText = compatibleVersionRange.replace(/(\s)*/g, '').replace(/\|\|/g, ', or ');
if (!semverSatisfies(myNodeVersion, compatibleVersionRange)) {
    warn(`Need Node.js version ${colors.cyan(compatibleVersionRangeText)}. But your Node.js version is ${colors.red(myNodeVersion)}. Please upgrade your Node.js first.`)
    process.exit(0) // Exit gracefully
}

const cwd = process.cwd();
const packageJsonPath = findPackageJson(cwd);

// Showing if you close prompt
const operationCancelled = () => {
    error(`Operation cancelled.`);
    process.exit(0); // Exit gracefully
};

if (packageJsonPath === null) {
    error(`A package.json file is necessary to initialize ESLint. Please run ${colors.dim('`npm init`')} to create a package.json file and try again.`);
    process.exit(1);
};

const argv = process.argv;
const sharedConfigIndex = process.argv.indexOf("--config");

if (sharedConfigIndex === -1) {
    const generator = new ConfigGenerator({ cwd, packageJsonPath });

    await generator.prompt().catch(() => operationCancelled());
    await generator.calc();
    await generator.output().catch(() => operationCancelled());
} else {

    // passed "--config"
    const packageName = argv[sharedConfigIndex + 1];
    const type = argv.includes("--eslintrc") ? "eslintrc" : "flat";
    const answers = { config: { packageName, type } };
    const generator = new ConfigGenerator({ cwd, packageJsonPath, answers });

    await generator.calc();
    await generator.output().catch(() => operationCancelled());
}
