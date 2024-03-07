/**
 * @fileoverview to generate config files.
 * @author 唯然<weiran.zsd@outlook.com>
 */
import process from "process";
import path from "path";
import { spawnSync } from "child_process";
import { writeFile } from "fs/promises";
import enquirer from "enquirer";
import { isPackageTypeModule, installSyncSaveDev, fetchPeerDependencies } from "./utils/npm-utils.js";
import { getShorthandName } from "./utils/naming.js";
import * as log from "./utils/logging.js";

// TODO: need to specify the package version - they may export flat configs in the future.
const jsStyleGuides = [
    { message: "Airbnb: https://github.com/airbnb/javascript", name: "airbnb", value: { packageName: "eslint-config-airbnb", type: "eslintrc" } },
    { message: "Standard: https://github.com/standard/standard", name: "standard", value: { packageName: "eslint-config-standard", type: "eslintrc" } },
    { message: "XO: https://github.com/xojs/eslint-config-xo", name: "xo", value: { packageName: "eslint-config-xo", type: "eslintrc" } }
];
const tsStyleGuides = [
    { message: "Standard: https://github.com/standard/eslint-config-standard-with-typescript", name: "standard", value: { packageName: "eslint-config-standard-with-typescript", type: "eslintrc" } },
    { message: "XO: https://github.com/xojs/eslint-config-xo-typescript", name: "xo", value: { packageName: "eslint-config-xo-typescript", type: "eslintrc" } }
];

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
    constructor(options = {}) {
        this.cwd = options.cwd || process.cwd();
        this.answers = options.answers || {};
        this.result = {
            devDependencies: ["eslint"],
            configFilename: "eslint.config.js",
            configContent: ""
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

        if (answers.purpose === "style") {
            const choices = this.answers.language === "javascript" ? jsStyleGuides : tsStyleGuides;
            const styleguideAnswer = await enquirer.prompt({
                type: "select",
                name: "styleguide",
                message: "Which style guide do you want to follow?",
                choices,
                result: choice => choices.find(it => it.name === choice).value
            });

            Object.assign(this.answers, styleguideAnswer);
        }
    }

    /**
     * Calculate the configuration based on the user's answers.
     * @returns {void}
     */
    calc() {
        const isESMModule = isPackageTypeModule(this.cwd);

        this.result.configFilename = isESMModule ? "eslint.config.js" : "eslint.config.mjs";

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
        let languageOptionsContent = "";
        let needCompatHelper = false;

        if (this.answers.purpose === "syntax") {

            // no need to install any plugin
        } else if (this.answers.purpose === "problem") {
            this.result.devDependencies.push("@eslint/js");
            importContent += "import pluginJs from \"@eslint/js\";\n";
            exportContent += "  pluginJs.configs.recommended,\n";
        } else if (this.answers.purpose === "style") {
            const styleguide = typeof this.answers.styleguide === "string"
                ? { packageName: this.answers.styleguide, type: "flat" }
                : this.answers.styleguide;

            this.result.devDependencies.push(styleguide.packageName);

            // install peer dependencies - it's needed for most eslintrc-style shared configs.
            const peers = fetchPeerDependencies(styleguide.packageName);

            if (peers !== null) {
                this.result.devDependencies.push(...peers);
            }

            if (styleguide.type === "flat" || styleguide.type === void 0) {
                importContent += `import styleGuide from "${styleguide.packageName}";\n`;
                exportContent += "  ...[].concat(styleGuide),\n";
            } else if (styleguide.type === "eslintrc") {
                needCompatHelper = true;

                const extendedName = getShorthandName(styleguide.packageName, "eslint-config");

                exportContent += `  ...compat.extends("${extendedName}"),\n`;
            }
        }

        if (this.answers.module === "commonjs" || this.answers.module === "script") {
            languageOptionsContent += `sourceType: "${this.answers.module}", `;
        }

        if (this.answers.env?.length > 0) {
            this.result.devDependencies.push("globals");
            importContent += "import globals from \"globals\";\n";
            const envContent = {
                browser: "globals: globals.browser",
                node: "globals: globals.node",
                "browser,node": "globals: {...globals.browser, ...globals.node}"
            };

            languageOptionsContent += `${envContent[this.answers.env.join(",")]}, `;
        }


        if (this.answers.language === "typescript") {
            this.result.devDependencies.push("typescript-eslint");
            importContent += "import tseslint from \"typescript-eslint\";\n";
            exportContent += "  ...tseslint.configs.recommended,\n";
        }

        if (this.answers.framework === "vue") {

            this.result.devDependencies.push("eslint-plugin-vue");

            // importContent += "import pluginVue from \"eslint-plugin-vue\";\n";

            // // TODO: there is a wip for flat support - https://github.com/vuejs/eslint-plugin-vue/pull/2319
            // exportContent += "  pluginVue.configs[\"flat/essential\"],\n";
            needCompatHelper = true;
            exportContent += "  ...compat.extends(\"plugin:vue/vue3-essential\").map(config => ({files: [\"**/*.vue\"], ...config})),\n";
        }

        if (this.answers.framework === "react") {
            this.result.devDependencies.push("eslint-plugin-react");
            importContent += "import pluginReactConfig from \"eslint-plugin-react/configs/recommended.js\";\n";
            exportContent += "  pluginReactConfig,\n";
        }

        if (needCompatHelper) {
            this.result.devDependencies.push("@eslint/eslintrc", "@eslint/js");
        }
        this.result.configContent = `${importContent}\n${needCompatHelper ? helperContent : ""}
export default [\n  {languageOptions:{${languageOptionsContent}}},\n${exportContent}];`;
    }

    /**
     * Output the configuration.
     * @returns {void}
     */
    async output() {
        const packageManager = (await enquirer.prompt({
            type: "select",
            name: "packageManager",
            message: "Which package manager do you want to use?",
            initial: 0,
            choices: ["npm", "yarn", "pnpm", "bun"]
        })).packageManager;

        installSyncSaveDev(this.result.devDependencies, packageManager);

        const configPath = path.join(this.cwd, this.result.configFilename);

        await writeFile(configPath, this.result.configContent);

        // import("eslint") won't work in some cases.
        // refs: https://github.com/eslint/create-config/issues/8, https://github.com/eslint/create-config/issues/12
        const eslintBin = path.join(this.cwd, "./node_modules/.bin/eslint");
        const result = spawnSync(eslintBin, ["--fix", "--quiet", configPath], { encoding: "utf8" });

        if (result.error || result.status !== 0) {
            log.error("A config file was generated, but the config file itself may not follow your linting rules.");
        }
    }
}
