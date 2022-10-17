/**
 * @fileoverview Config initialization wizard.
 * @author Ilya Volodin
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import path from "path";
import fs from "fs";
import enquirer from "enquirer";
import semver from "semver";
import { Legacy } from "@eslint/eslintrc";
import { info } from "../shared/logging.js";
import * as ConfigFile from "./config-file.js";
import * as npmUtils from "./npm-utils.js";
import mri from "mri";

const { ConfigOps, naming, ModuleResolver } = Legacy;

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

/* istanbul ignore next: hard to test fs function */
/**
 * Create .eslintrc file in the current working directory
 * @param {Object} config object that contains user's answers
 * @param {string} format The file format to write to.
 * @returns {void}
 */
async function writeFile(config, format) {

    // default is .js
    let extname = ".js";

    if (format === "YAML") {
        extname = ".yml";
    } else if (format === "JSON") {
        extname = ".json";
    } else if (format === "JavaScript") {
        const pkgJSONPath = npmUtils.findPackageJson();

        if (pkgJSONPath) {
            const pkgJSONContents = JSON.parse(fs.readFileSync(pkgJSONPath, "utf8"));

            if (pkgJSONContents.type === "module") {
                extname = ".cjs";
            }
        }
    }

    delete config.installedESLint;

    await ConfigFile.write(config, `./.eslintrc${extname}`);
    info(`Successfully created .eslintrc${extname} file in ${process.cwd()}`);
}

/**
 * Get the peer dependencies of the given module.
 * This adds the gotten value to cache at the first time, then reuses it.
 * In a process, this function is called twice, but `npmUtils.fetchPeerDependencies` needs to access network which is relatively slow.
 * @param {string} moduleName The module name to get.
 * @returns {Object} The peer dependencies of the given module.
 * This object is the object of `peerDependencies` field of `package.json`.
 * Returns null if npm was not found.
 */
function getPeerDependencies(moduleName) {
    let result = getPeerDependencies.cache.get(moduleName);

    if (!result) {
        info(`Checking peerDependencies of ${moduleName}`);

        result = npmUtils.fetchPeerDependencies(moduleName);
        getPeerDependencies.cache.set(moduleName, result);
    }

    return result;
}
getPeerDependencies.cache = new Map();

/**
 * Return necessary plugins, configs, parsers, etc. based on the config
 * @param {Object} config config object
 * @param {boolean} [installESLint=true] If `false` is given, it does not install eslint.
 * @returns {string[]} An array of modules to be installed.
 */
function getModulesList(config, installESLint) {
    const modules = {};

    // Create a list of modules which should be installed based on config
    if (config.plugins) {
        for (const plugin of config.plugins) {
            const moduleName = naming.normalizePackageName(plugin, "eslint-plugin");

            modules[moduleName] = "latest";
        }
    }

    const extendList = [];
    const overrides = config.overrides || [];

    for (const item of [config, ...overrides]) {
        if (typeof item.extends === "string") {
            extendList.push(item.extends);
        } else if (Array.isArray(item.extends)) {
            extendList.push(...item.extends);
        }
    }

    for (const extend of extendList) {
        if (extend.startsWith("eslint:") || extend.startsWith("plugin:")) {
            continue;
        }
        const moduleName = naming.normalizePackageName(extend, "eslint-config");

        modules[moduleName] = "latest";
        Object.assign(
            modules,
            getPeerDependencies(`${moduleName}@latest`)
        );
    }

    const parser = config.parser || (config.parserOptions && config.parserOptions.parser);

    if (parser) {
        modules[parser] = "latest";
    }

    if (installESLint === false) {
        delete modules.eslint;
    } else {
        const installStatus = npmUtils.checkDevDeps(["eslint"]);

        // Mark to show messages if it's new installation of eslint.
        if (installStatus.eslint === false) {
            info("Local ESLint installation not found.");
            modules.eslint = modules.eslint || "latest";
            config.installedESLint = true;
        }
    }

    return Object.keys(modules).map(name => `${name}@${modules[name]}`);
}

/**
 * process user's answers and create config object
 * @param {Object} answers answers received from enquirer
 * @returns {Object} config object
 */
function processAnswers(answers) {
    const config = {
        rules: {},
        env: {},
        parserOptions: {},
        extends: [],
        overrides: []
    };

    config.parserOptions.ecmaVersion = "latest";
    config.env.es2021 = true;

    // set the module type
    if (answers.moduleType === "esm") {
        config.parserOptions.sourceType = "module";
    } else if (answers.moduleType === "commonjs") {
        config.env.commonjs = true;
    }

    // add in browser and node environments if necessary
    answers.env.forEach(env => {
        config.env[env] = true;
    });

    // add in library information
    if (answers.framework === "react") {
        config.plugins = ["react"];
        config.extends.push("plugin:react/recommended");
    } else if (answers.framework === "vue") {
        config.plugins = ["vue"];
        config.extends.push("plugin:vue/vue3-essential");
    }

    // if answers.source == "guide", the ts supports should be in the shared config.
    if (answers.typescript && answers.source !== "guide") {
        config.parser = "@typescript-eslint/parser";

        if (Array.isArray(config.plugins)) {
            config.plugins.push("@typescript-eslint");
        } else {
            config.plugins = ["@typescript-eslint"];
        }
    }

    // set config.extends based the selected guide
    if (answers.source === "guide") {
        if (answers.styleguide === "airbnb" && answers.framework !== "react") {
            config.extends.push("airbnb-base");
        } else if (answers.styleguide === "xo-typescript") {
            config.extends.push("xo");
            config.overrides.push({
                files: ["*.ts", "*.tsx"],
                extends: ["xo-typescript"]
            });
        } else {
            config.extends.push(answers.styleguide);
        }
    }


    // setup rules based on problems/style enforcement preferences
    if (answers.purpose === "problems") {
        config.extends.unshift("eslint:recommended");
    } else if (answers.purpose === "style") {
        if (answers.source === "prompt") {
            config.extends.unshift("eslint:recommended");
            config.rules.indent = ["error", answers.indent];
            config.rules.quotes = ["error", answers.quotes];
            config.rules["linebreak-style"] = ["error", answers.linebreak];
            config.rules.semi = ["error", answers.semi ? "always" : "never"];
        }
    }
    if (answers.typescript && config.extends.includes("eslint:recommended")) {
        config.extends.push("plugin:@typescript-eslint/recommended");
    }

    // normalize extends
    if (config.extends.length === 0) {
        delete config.extends;
    } else if (config.extends.length === 1) {
        config.extends = config.extends[0];
    }

    ConfigOps.normalizeToStrings(config);
    return config;
}

/**
 * Get the version of the local ESLint.
 * @returns {string|null} The version. If the local ESLint was not found, returns null.
 */
function getLocalESLintVersion() {
    try {
        const eslintPkgPath = path.join(ModuleResolver.resolve("eslint/package.json", path.join(process.cwd(), "__placeholder__.js")));
        const eslintPkg = JSON.parse(fs.readFileSync(eslintPkgPath, "utf8"));

        return eslintPkg.version || null;
    } catch {
        return null;
    }
}

/**
 * Get the shareable config name of the chosen style guide.
 * @param {Object} answers The answers object.
 * @returns {string} The shareable config name.
 */
function getStyleGuideName(answers) {
    if (answers.styleguide === "airbnb" && answers.framework !== "react") {
        return "airbnb-base";
    }
    return answers.styleguide;
}

/**
 * Check whether the local ESLint version conflicts with the required version of the chosen shareable config.
 * @param {Object} answers The answers object.
 * @returns {boolean} `true` if the local ESLint is found then it conflicts with the required version of the chosen shareable config.
 */
function hasESLintVersionConflict(answers) {

    // Get the local ESLint version.
    const localESLintVersion = getLocalESLintVersion();

    if (!localESLintVersion) {
        return false;
    }

    // Get the required range of ESLint version.
    const configName = getStyleGuideName(answers);
    const moduleName = `eslint-config-${configName}@latest`;
    const peerDependencies = getPeerDependencies(moduleName) || {};
    const requiredESLintVersionRange = peerDependencies.eslint;

    if (!requiredESLintVersionRange) {
        return false;
    }

    answers.localESLintVersion = localESLintVersion;
    answers.requiredESLintVersionRange = requiredESLintVersionRange;

    // Check the version.
    if (semver.satisfies(localESLintVersion, requiredESLintVersionRange)) {
        answers.installESLint = false;
        return false;
    }

    return true;
}

/**
 * Install modules.
 * @param {string[]} modules Modules to be installed.
 * @param {string} packageManager Package manager to use for installation.
 * @returns {void}
 */
function installModules(modules, packageManager) {
    info(`Installing ${modules.join(", ")}`);
    npmUtils.installSyncSaveDev(modules, packageManager);
}

/* istanbul ignore next: no need to test enquirer */
/**
 * Ask user to install modules.
 * @param {string[]} modules Array of modules to be installed.
 * @returns {Promise<void>} Answer that indicates if user wants to install.
 */
function askInstallModules(modules) {

    // If no modules, do nothing.
    if (modules.length === 0) {
        return Promise.resolve();
    }

    info("The config that you've selected requires the following dependencies:\n");
    info(modules.join(" "));
    return enquirer.prompt([
        {
            type: "toggle",
            name: "executeInstallation",
            message: "Would you like to install them now?",
            enabled: "Yes",
            disabled: "No",
            initial: 1,
            skip() {
                return !modules.length;
            },
            result(input) {
                return this.skipped ? null : input;
            }
        },
        {
            type: "select",
            name: "packageManager",
            message: "Which package manager do you want to use?",
            initial: 0,
            choices: ["npm", "yarn", "pnpm"],
            skip() {
                return !this.state.answers.executeInstallation;
            }
        }
    ]).then(({ executeInstallation, packageManager }) => {
        if (executeInstallation) {
            installModules(modules, packageManager);
        }
    });
}

/* istanbul ignore next: no need to test enquirer */
/**
 * Ask use a few questions on command prompt
 * @returns {Promise<void>} The promise with the result of the prompt
 */
function promptUser() {
    const packageJsonExists = npmUtils.checkPackageJson();

    if (!packageJsonExists) {
        throw new Error("A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.");
    }

    const styleGuides = [];

    return enquirer.prompt([
        {
            type: "select",
            name: "purpose",
            message: "How would you like to use ESLint?",

            // The returned number matches the name value of nth in the choices array.
            initial: 1,
            choices: [
                { message: "To check syntax only", name: "syntax" },
                { message: "To check syntax and find problems", name: "problems" },
                { message: "To check syntax, find problems, and enforce code style", name: "style" }
            ]
        },
        {
            type: "select",
            name: "moduleType",
            message: "What type of modules does your project use?",
            initial: 0,
            choices: [
                { message: "JavaScript modules (import/export)", name: "esm" },
                { message: "CommonJS (require/exports)", name: "commonjs" },
                { message: "None of these", name: "none" }
            ]
        },
        {
            type: "select",
            name: "framework",
            message: "Which framework does your project use?",
            initial: 0,
            choices: [
                { message: "React", name: "react" },
                { message: "Vue.js", name: "vue" },
                { message: "None of these", name: "none" }
            ]
        },
        {
            type: "toggle",
            name: "typescript",
            message: "Does your project use TypeScript?",
            enabled: "Yes",
            disabled: "No",
            initial: 0,
            result(val) {
                if (val) {

                    // remove airbnb/google javascript style guide, as they do not support ts
                    styleGuides.push(
                        { message: "Standard: https://github.com/standard/eslint-config-standard-with-typescript", name: "standard-with-typescript" },
                        { message: "XO: https://github.com/xojs/eslint-config-xo-typescript", name: "xo-typescript" }
                    );
                } else {
                    styleGuides.push(
                        { message: "Airbnb: https://github.com/airbnb/javascript", name: "airbnb" },
                        { message: "Standard: https://github.com/standard/standard", name: "standard" },
                        { message: "Google: https://github.com/google/eslint-config-google", name: "google" },
                        { message: "XO: https://github.com/xojs/eslint-config-xo", name: "xo" }
                    );
                }
                return val;
            }
        },
        {
            type: "multiselect",
            name: "env",
            message: "Where does your code run?",
            hint: "(Press <space> to select, <a> to toggle all, <i> to invert selection)",
            initial: 0,
            choices: [
                { message: "Browser", name: "browser" },
                { message: "Node", name: "node" }
            ]
        },
        {
            type: "select",
            name: "source",
            message: "How would you like to define a style for your project?",
            choices: [
                { message: "Use a popular style guide", name: "guide" },
                { message: "Answer questions about your style", name: "prompt" }
            ],
            skip() {
                return this.state.answers.purpose !== "style";
            },
            result(input) {
                return this.skipped ? null : input;
            }
        },
        {
            type: "select",
            name: "styleguide",
            message: "Which style guide do you want to follow?",
            choices: styleGuides,
            skip() {
                return this.state.answers.source !== "guide";
            },
            result(input) {
                return this.skipped ? null : input;
            }
        },
        {
            type: "select",
            name: "format",
            message: "What format do you want your config file to be in?",
            initial: 0,
            choices: ["JavaScript", "YAML", "JSON"]
        },
        {
            type: "toggle",
            name: "installESLint",
            message() {
                const { answers } = this.state;
                const verb = semver.ltr(answers.localESLintVersion, answers.requiredESLintVersionRange)
                    ? "upgrade"
                    : "downgrade";

                return `The style guide "${answers.styleguide}" requires eslint@${answers.requiredESLintVersionRange}. You are currently using eslint@${answers.localESLintVersion}.\n  Do you want to ${verb}?`;
            },
            enabled: "Yes",
            disabled: "No",
            initial: 1,
            skip() {
                return !(this.state.answers.source === "guide" && hasESLintVersionConflict(this.state.answers));
            },
            result(input) {
                return this.skipped ? null : input;
            }
        }
    ]).then(earlyAnswers => {

        // early exit if no style guide is necessary
        if (earlyAnswers.purpose !== "style") {
            const config = processAnswers(earlyAnswers);
            const modules = getModulesList(config);

            return askInstallModules(modules)
                .then(() => writeFile(config, earlyAnswers.format));
        }

        // early exit if you are using a style guide
        if (earlyAnswers.source === "guide") {
            if (earlyAnswers.installESLint === false && !semver.satisfies(earlyAnswers.localESLintVersion, earlyAnswers.requiredESLintVersionRange)) {
                info(`Note: it might not work since ESLint's version is mismatched with the ${earlyAnswers.styleguide} config.`);
            }

            const config = processAnswers(earlyAnswers);
            const modules = getModulesList(config);

            return askInstallModules(modules)
                .then(() => writeFile(config, earlyAnswers.format));

        }

        // continue with the style questions otherwise...
        return enquirer.prompt([
            {
                type: "select",
                name: "indent",
                message: "What style of indentation do you use?",
                initial: 0,
                choices: [{ message: "Tabs", name: "tab" }, { message: "Spaces", name: 4 }]
            },
            {
                type: "select",
                name: "quotes",
                message: "What quotes do you use for strings?",
                initial: 0,
                choices: [{ message: "Double", name: "double" }, { message: "Single", name: "single" }]
            },
            {
                type: "select",
                name: "linebreak",
                message: "What line endings do you use?",
                initial: 0,
                choices: [{ message: "Unix", name: "unix" }, { message: "Windows", name: "windows" }]
            },
            {
                type: "toggle",
                name: "semi",
                message: "Do you require semicolons?",
                enabled: "Yes",
                disabled: "No",
                initial: 1
            }
        ]).then(answers => {
            const totalAnswers = Object.assign({}, earlyAnswers, answers);

            const config = processAnswers(totalAnswers);
            const modules = getModulesList(config);

            return askInstallModules(modules).then(() => writeFile(config, earlyAnswers.format));
        });
    });
}

/* istanbul ignore next */
/** an wrapper for promptUser
 *  @returns {void}
 */
function initializeConfig() {
    const argv = mri(process.argv.slice(2));

    if (argv.config) {
        const config = {
            extends: typeof argv.config === "string" ? argv.config.split(",") : argv.config
        };
        const modules = getModulesList(config);

        return askInstallModules(modules).then(() => writeFile(config, "JavaScript"));
    }

    return promptUser();
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export {
    getModulesList,
    hasESLintVersionConflict,
    installModules,
    processAnswers,
    writeFile,
    initializeConfig
};
