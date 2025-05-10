/**
 * @fileoverview to generate config files.
 * @author 唯然<weiran.zsd@outlook.com>
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import process from "node:process";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import enquirer from "enquirer";
import semverGreaterThanRange from "semver/ranges/gtr.js";
import { isPackageTypeModule, installSyncSaveDev, fetchPeerDependencies, findPackageJson } from "./utils/npm-utils.js";
import { getShorthandName } from "./utils/naming.js";
import * as log from "./utils/logging.js";
import { langQuestions, jsQuestions, mdQuestions, installationQuestions } from "./questions.js";

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Get the file extensions to lint based on the user's answers.
 * @param {Object} answers The answers provided by the user.
 * @returns {string[]} The file extensions to lint.
 */
function getExtensions(answers) {
    const extensions = ["js", "mjs", "cjs"];

    if (answers.useTs) {
        extensions.push("ts");
    }

    if (answers.framework === "vue") {
        extensions.push("vue");
    }

    if (answers.framework === "react") {
        extensions.push("jsx");

        if (answers.useTs) {
            extensions.push("tsx");
        }
    }

    return extensions;
}

const helperContent = `import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({baseDirectory: __dirname, recommendedConfig: js.configs.recommended});
`;

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * Class representing a ConfigGenerator.
 */
export class ConfigGenerator {

    /**
     * Create a ConfigGenerator.
     * @param {Object} options The options for the ConfigGenerator.
     * @param {string} options.cwd The current working directory.
     * @param {Object} options.answers The answers provided by the user.
     * @returns {ConfigGenerator} The ConfigGenerator instance.
     */
    constructor(options) {
        this.cwd = options.cwd;
        this.packageJsonPath = options.packageJsonPath || findPackageJson(this.cwd);
        this.answers = options.answers || {};
        this.result = {
            devDependencies: ["eslint"],
            configFilename: "eslint.config.js",
            configContent: "",
            installFlags: ["-D"]
        };
    }

    /**
     * Prompt the user for input.
     * @returns {void}
     */
    async prompt() {
        Object.assign(this.answers, await enquirer.prompt(langQuestions));

        if (this.answers.languages.includes("javascript")) {
            Object.assign(this.answers, await enquirer.prompt(jsQuestions));
        }

        if (this.answers.languages.includes("md")) {
            Object.assign(this.answers, await enquirer.prompt(mdQuestions));
        }
    }

    /**
     * Calculate the configuration based on the user's answers.
     * @returns {void}
     */
    async calc() {
        const isESMModule = isPackageTypeModule(this.packageJsonPath);

        this.result.configFilename = isESMModule ? "eslint.config.js" : "eslint.config.mjs";
        this.answers.config = typeof this.answers.config === "string"
            ? { packageName: this.answers.config, type: "flat" }
            : this.answers.config;

        const extensions = `**/*.{${getExtensions(this.answers)}}`;
        const languages = this.answers.languages ?? ["javascript"];
        const purpose = this.answers.purpose;

        let isDefineConfigExported = false;
        let importContent = "";
        let exportContent = "";
        let needCompatHelper = false;

        // language = javascript/typescript
        if (languages.includes("javascript")) {

            const useTs = this.answers.useTs;

            if (purpose === "problems") {
                this.result.devDependencies.push("@eslint/js");
                importContent += "import js from \"@eslint/js\";\n";
                exportContent += `  { files: ["${extensions}"], plugins: { js }, extends: ["js/recommended"] },\n`;
            }

            if (this.answers.moduleType === "commonjs" || this.answers.moduleType === "script") {
                exportContent += `  { files: ["**/*.js"], languageOptions: { sourceType: "${this.answers.moduleType}" } },\n`;
            }

            if (this.answers.env?.length > 0) {
                this.result.devDependencies.push("globals");
                importContent += "import globals from \"globals\";\n";
                const envContent = {
                    browser: "globals: globals.browser",
                    node: "globals: globals.node",
                    "browser,node": "globals: {...globals.browser, ...globals.node}"
                };

                exportContent += `  { files: ["${extensions}"], languageOptions: { ${envContent[this.answers.env.join(",")]} } },\n`;
            }
            if (useTs) {
                this.result.devDependencies.push("typescript-eslint");
                importContent += "import tseslint from \"typescript-eslint\";\n";
                exportContent += "  tseslint.configs.recommended,\n";
            }

            if (this.answers.framework === "vue") {
                this.result.devDependencies.push("eslint-plugin-vue");
                importContent += "import pluginVue from \"eslint-plugin-vue\";\n";
                exportContent += "  pluginVue.configs[\"flat/essential\"],\n";

                // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
                if (useTs) {
                    exportContent += "  { files: [\"**/*.vue\"], languageOptions: { parserOptions: { parser: tseslint.parser } } },\n";
                }
            }

            if (this.answers.framework === "react") {
                this.result.devDependencies.push("eslint-plugin-react");
                importContent += "import pluginReact from \"eslint-plugin-react\";\n";
                exportContent += "  pluginReact.configs.flat.recommended,\n";
            }

        } else {
            exportContent += "  { ignores: [\"**/*.js\", \"**/*.cjs\", \"**/*.mjs\"] },\n";
        }

        // language = json/jsonc/json5
        if (languages.some(item => item.startsWith("json"))) {
            this.result.devDependencies.push("@eslint/json");
            importContent += "import json from \"@eslint/json\";\n";

            if (languages.includes("json")) {
                const config = purpose === "syntax"
                    ? "  { files: [\"**/*.json\"], plugins: { json }, language: \"json/json\" },\n"
                    : "  { files: [\"**/*.json\"], plugins: { json }, language: \"json/json\", extends: [\"json/recommended\"] },\n";

                exportContent += config;
            }
            if (languages.includes("jsonc")) {
                const config = purpose === "syntax"
                    ? "  { files: [\"**/*.jsonc\"], plugins: { json }, language: \"json/jsonc\" },\n"
                    : "  { files: [\"**/*.jsonc\"], plugins: { json }, language: \"json/jsonc\", extends: [\"json/recommended\"] },\n";

                exportContent += config;
            }
            if (languages.includes("json5")) {
                const config = purpose === "syntax"
                    ? "  { files: [\"**/*.json5\"], plugins: { json }, language: \"json/json5\" },\n"
                    : "  { files: [\"**/*.json5\"], plugins: { json }, language: \"json/json5\", extends: [\"json/recommended\"] },\n";

                exportContent += config;
            }
        }

        // language = markdown
        if (languages.includes("md")) {
            this.result.devDependencies.push("@eslint/markdown");
            importContent += "import markdown from \"@eslint/markdown\";\n";

            if (purpose === "syntax") {
                exportContent += `  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/${this.answers.mdType}" },\n`;
            } else if (purpose === "problems") {
                exportContent += `  { files: ["**/*.md"], plugins: { markdown }, language: "markdown/${this.answers.mdType}", extends: ["markdown/recommended"] },\n`;
            }
        }

        // language = css
        if (languages.includes("css")) {
            this.result.devDependencies.push("@eslint/css");
            importContent += "import css from \"@eslint/css\";\n";

            if (purpose === "syntax") {
                exportContent += "  { files: [\"**/*.css\"], plugins: { css }, language: \"css/css\" },\n";
            } else if (purpose === "problems") {
                exportContent += "  { files: [\"**/*.css\"], plugins: { css }, language: \"css/css\", extends: [\"css/recommended\"] },\n";
            }
        }

        // passed `--config`
        if (this.answers.config) {
            const config = this.answers.config;

            this.result.devDependencies.push(config.packageName);

            // install peer dependencies - it's needed for most eslintrc-style shared configs.
            const peers = await fetchPeerDependencies(config.packageName);

            if (peers !== null) {
                const eslintIndex = peers.findIndex(dep => (dep.startsWith("eslint@")));

                if (eslintIndex === -1) {
                    // eslint is not in the peer dependencies

                    this.result.devDependencies.push(...peers);
                } else {
                    const versionMatch = peers[eslintIndex].match(/eslint@(.+)/u);
                    const versionRequirement = versionMatch[1]; // Complete version requirement string

                    // Check if the version requirement allows for ESLint 9.22.0+
                    isDefineConfigExported = !semverGreaterThanRange("9.22.0", versionRequirement);

                    // eslint is in the peer dependencies => overwrite eslint version
                    this.result.devDependencies[0] = peers[eslintIndex];
                    peers.splice(eslintIndex, 1);
                    this.result.devDependencies.push(...peers);
                }
            }

            if (config.type === "flat" || config.type === void 0) {
                importContent += `import config from "${config.packageName}";\n`;
                exportContent += "  config,\n";
            } else if (config.type === "eslintrc") {
                needCompatHelper = true;

                const shorthandName = getShorthandName(config.packageName, "eslint-config");

                exportContent += `  compat.extends("${shorthandName}"),\n`;
            }
        } else {
            isDefineConfigExported = true;
        }

        if (isDefineConfigExported) {
            importContent += "import { defineConfig } from \"eslint/config\";\n";
        } else {
            this.result.devDependencies.push("@eslint/config-helpers");
            importContent += "import { defineConfig } from \"@eslint/config-helpers\";\n";
        }

        if (needCompatHelper) {
            this.result.devDependencies.push("@eslint/eslintrc", "@eslint/js");
        }
        this.result.configContent = `${importContent}
${needCompatHelper ? helperContent : ""}
export default defineConfig([\n${exportContent || "  {}\n"}]);\n`; // defaults to `[{}]` to avoid empty config warning
    }

    /**
     * Output the configuration.
     * @returns {void}
     */
    async output() {

        log.info("The config that you've selected requires the following dependencies:\n");
        log.info(this.result.devDependencies.join(", "));


        const { executeInstallation, packageManager } = (await enquirer.prompt(installationQuestions));
        const configPath = path.join(this.cwd, this.result.configFilename);

        if (executeInstallation === true) {
            log.info("☕️Installing...");
            installSyncSaveDev(this.result.devDependencies, packageManager, this.result.installFlags);
            await writeFile(configPath, this.result.configContent);

            // import("eslint") won't work in some cases.
            // refs: https://github.com/eslint/create-config/issues/8, https://github.com/eslint/create-config/issues/12
            const eslintBin = path.join(this.packageJsonPath, "../node_modules/eslint/bin/eslint.js");
            const result = spawnSync(process.execPath, [eslintBin, "--fix", "--quiet", configPath], { encoding: "utf8" });

            if (result.error || result.status !== 0) {
                log.error("A config file was generated, but the config file itself may not follow your linting rules.");
            } else {
                log.info(`Successfully created ${configPath} file.`);
            }
        } else {
            await writeFile(configPath, this.result.configContent);

            log.info(`Successfully created ${configPath} file.`);
            log.warn("You will need to install the dependencies yourself.");
        }
    }
}
