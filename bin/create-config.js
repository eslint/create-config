#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the `npm init @eslint/config` command.
 * @author 唯然<weiran.zsd@outlook.com>
 */

import { ConfigGenerator } from "../lib/config-generator.js";
import process from "process";
const argv = process.argv;

const sharedConfigIndex = process.argv.indexOf("--config");

if (sharedConfigIndex === -1) {
    const generator = new ConfigGenerator();

    await generator.prompt();
    generator.calc();
    await generator.output();
} else {

    // passed "--config"
    const packageName = argv[sharedConfigIndex + 1];
    const type = argv.includes("--eslintrc") ? "eslintrc" : "flat";
    const answers = { purpose: "style", moduleType: "module", styleguide: { packageName, type } };
    const generator = new ConfigGenerator({ answers });

    generator.calc();
    await generator.output();
}
