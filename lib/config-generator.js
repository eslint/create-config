/**
 * @fileoverview to generate config files.
 * @author 唯然<weiran.zsd@outlook.com>
 */
import process from "process";
import path from "path";
import { spawnSync } from "child_process";
import { writeFile } from "fs/promises";
import enquirer from "enquirer";
import { isPackageTypeModule, installSyncSaveDev, fetchPeerDependencies, findPackageJson } from "./utils/npm-utils.js";
import { getShorthandName } from "./utils/naming.js";
import * as log from "./utils/logging.js";

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
            devDependencies: ["eslint@9.x"],
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
        const questions = [
            {
                type: "select",
                name: "purpose",
                message: "How would you like to use ESLint?",
                initial: 1,
                choices: [
                    { message: "To check syntax only", name: "syntax" },
                    { message: "To check syntax and find problems", name: "problems" }
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
                    { message: "None of these", name: "script" }
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
                type: "select",
                name: "eslintVersion",
                message: "The React plugin doesn't officially support ESLint v9 yet. What would you like to do?",
                initial: 0,
                choices: [
                    { message: "Install ESLint v9.x with compatibility utilities", name: "9.x" },
                    { message: "Install ESLint v8.x", name: "8.x" }
                ],
                skip() {
                    return this.state.answers.framework !== "react";
                }
            },
            {
                type: "select",
                name: "language",
                message: "Does your project use TypeScript?",
                choices: [
                    { message: "No", name: "javascript" },
                    { message: "Yes", name: "typescript" }
                ],
                initial: 0
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
            }
        ];

        const answers = await enquirer.prompt(questions);

        Object.assign(this.answers, answers);
    }

    /**
     * Calculate the configuration based on the user's answers.
     * @returns {void}
     */
    calc() {
        const isESMModule = isPackageTypeModule(this.packageJsonPath);

        this.result.configFilename = isESMModule ? "eslint.config.js" : "eslint.config.mjs";
        this.answers.config = typeof this.answers.config === "string"
            ? { packageName: this.answers.config, type: "flat" }
            : this.answers.config;

        let importContent = "";
        const helperContent = `import path from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import pluginJs from "@eslint/js";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended});
`;
        let exportContent = "";
        let needCompatHelper = false;

        if (this.answers.moduleType === "commonjs" || this.answers.moduleType === "script") {
            exportContent += `  {files: ["**/*.js"], languageOptions: {sourceType: "${this.answers.moduleType}"}},\n`;
        }

        if (this.answers.env?.length > 0) {
            this.result.devDependencies.push("globals");
            importContent += "import globals from \"globals\";\n";
            const envContent = {
                browser: "globals: globals.browser",
                node: "globals: globals.node",
                "browser,node": "globals: {...globals.browser, ...globals.node}"
            };

            exportContent += `  {languageOptions: { ${envContent[this.answers.env.join(",")]} }},\n`;
        }

        if (this.answers.purpose === "syntax") {

            // no need to install any plugin
        } else if (this.answers.purpose === "problems") {
            this.result.devDependencies.push("@eslint/js");
            importContent += "import pluginJs from \"@eslint/js\";\n";
            exportContent += "  pluginJs.configs.recommended,\n";
        }

        if (this.answers.language === "typescript") {
            this.result.devDependencies.push("typescript-eslint");
            this.result.installFlags.push("--force"); // tseslint does not support eslint 9.x yet
            importContent += "import tseslint from \"typescript-eslint\";\n";
            exportContent += "  ...tseslint.configs.recommended,\n";
        }

        if (this.answers.framework === "vue") {

            this.result.devDependencies.push("eslint-plugin-vue");

            importContent += "import pluginVue from \"eslint-plugin-vue\";\n";
            exportContent += "  ...pluginVue.configs[\"flat/essential\"],\n";
        }

        if (this.answers.framework === "react") {
            if (this.answers.eslintVersion === "9.x") {
                this.result.devDependencies.push("eslint-plugin-react", "@eslint/compat");
                if (!this.result.installFlags.includes("--force")) {
                    this.result.installFlags.push("--force");
                }
                importContent += "import pluginReactConfig from \"eslint-plugin-react/configs/recommended.js\";\n";
                importContent += "import { fixupConfigRules } from \"@eslint/compat\";\n";
                exportContent += "  ...fixupConfigRules(pluginReactConfig),\n";
            } else if (this.answers.eslintVersion === "8.x") {
                this.result.devDependencies[0] = "eslint@8.x";
                this.result.devDependencies.push("eslint-plugin-react");
                importContent += "import pluginReactConfig from \"eslint-plugin-react/configs/recommended.js\";\n";
                exportContent += "  pluginReactConfig,\n";
            }
        }
        if (this.answers.config) {
            const config = this.answers.config;

            this.result.devDependencies.push(config.packageName);

            // install peer dependencies - it's needed for most eslintrc-style shared configs.
            const peers = fetchPeerDependencies(config.packageName);

            if (peers !== null) {
                const eslintIndex = peers.findIndex(dep => (dep.startsWith("eslint@")));

                if (eslintIndex === -1) {
                    // eslint is not in the peer dependencies

                    this.result.devDependencies.push(...peers);
                } else {

                    // eslint is in the peer dependencies => overwrite eslint version
                    this.result.devDependencies[0] = peers[eslintIndex];
                    peers.splice(eslintIndex, 1);
                    this.result.devDependencies.push(...peers);
                }
            }

            if (config.type === "flat" || config.type === void 0) {
                importContent += `import config from "${config.packageName}";\n`;
                exportContent += "  ...[].concat(config),\n";
            } else if (config.type === "eslintrc") {
                needCompatHelper = true;

                const shorthandName = getShorthandName(config.packageName, "eslint-config");

                exportContent += `  ...compat.extends("${shorthandName}"),\n`;
            }
        }

        if (needCompatHelper) {
            this.result.devDependencies.push("@eslint/eslintrc", "@eslint/js");
        }

        this.result.configContent = `${importContent}
${needCompatHelper ? helperContent : ""}
export default [\n${exportContent}];`;
    }

    /**
     * Output the configuration.
     * @returns {void}
     */
    async output() {

        log.info("The config that you've selected requires the following dependencies:\n");
        log.info(this.result.devDependencies.join(", "));

        const questions = [{
            type: "toggle",
            name: "executeInstallation",
            message: "Would you like to install them now?",
            enabled: "Yes",
            disabled: "No",
            initial: 1
        }, {
            type: "select",
            name: "packageManager",
            message: "Which package manager do you want to use?",
            initial: 0,
            choices: ["npm", "yarn", "pnpm", "bun"],
            skip() {
                return this.state.answers.executeInstallation === false;
            }
        }];
        const { executeInstallation, packageManager } = (await enquirer.prompt(questions));
        const configPath = path.join(this.cwd, this.result.configFilename);

        if (executeInstallation === true) {

            // removing `--force` when:
            // 1. yarn v2+ -- it does not support it.
            // 2. eslint v8.x -- it does not need it.
            if (packageManager === "yarn" || this.answers.eslintVersion === "8.x") {
                const index = this.result.installFlags.indexOf("--force");

                if (index !== -1) {
                    this.result.installFlags.splice(index, 1);
                }
            }

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
