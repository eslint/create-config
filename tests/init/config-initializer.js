/**
 * @fileoverview Tests for configInitializer.
 * @author Ilya Volodin
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import chai from "chai";
import fs from "fs";
import path from "path";
import sinon from "sinon";
import sh from "shelljs";
import esmock from "esmock";
import { fileURLToPath } from "url";
import * as npmUtils from "../../lib/init/npm-utils.js";
import { defineInMemoryFs } from "../_utils/index.js";

const originalDir = process.cwd();
const { assert } = chai;

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

let fixtureDir;
let localInstalledEslintDir;

/**
 * change local installed eslint version in fixtures
 * @param {string|null} version installed eslint version, null => not installed
 * @returns {void}
 */
function setLocalInstalledEslint(version) {
    const eslintPkgPath = path.join(localInstalledEslintDir, "./package.json");
    let pkg = JSON.parse(fs.readFileSync(eslintPkgPath, "utf8"));

    if (version) {
        pkg.version = version;
    } else {
        pkg = {};
    }

    fs.writeFileSync(eslintPkgPath, JSON.stringify(pkg, null, 2), "utf8");
}


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

let answers = {};
let pkgJSONContents = {};
let pkgJSONPath = "";

describe("configInitializer", () => {

    let npmCheckStub;
    let npmInstallStub;
    let npmFetchPeerDependenciesStub;
    let init;
    let log;


    // copy into clean area so as not to get "infected" by this project's .eslintrc files
    before(() => {
        const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle

        fixtureDir = path.join(__filename, "../../../tmp/eslint/fixtures/config-initializer");
        localInstalledEslintDir = path.join(fixtureDir, "./node_modules/eslint");
        sh.mkdir("-p", localInstalledEslintDir);
        sh.cp("-r", "./tests/fixtures/config-initializer/.", fixtureDir);
        sh.cp("-r", "./tests/fixtures/eslint/.", localInstalledEslintDir);
        fixtureDir = fs.realpathSync(fixtureDir);
    });

    beforeEach(async () => {
        log = {
            info: sinon.spy(),
            error: sinon.spy()
        };

        npmInstallStub = sinon.stub();
        npmCheckStub = sinon.fake(packages => packages.reduce((status, pkg) => {
            status[pkg] = false;
            return status;
        }, {}));
        npmFetchPeerDependenciesStub = sinon.fake(() => ({
            eslint: "^3.19.0",
            "eslint-plugin-jsx-a11y": "^5.0.1",
            "eslint-plugin-import": "^2.2.0",
            "eslint-plugin-react": "^7.0.1"
        }));

        const requireStubs = {
            "../../lib/shared/logging.js": log,
            "../../lib/init/npm-utils.js": {
                ...npmUtils,
                installSyncSaveDev: npmInstallStub,
                checkDevDeps: npmCheckStub,
                fetchPeerDependencies: npmFetchPeerDependenciesStub
            }
        };

        init = await esmock("../../lib/init/config-initializer.js", requireStubs, {});
    });

    afterEach(() => {
        log.info.resetHistory();
        log.error.resetHistory();
        npmInstallStub.resetHistory();
        npmCheckStub.resetHistory();
        npmFetchPeerDependenciesStub.resetHistory();
    });

    after(() => {
        sh.rm("-r", fixtureDir);
    });

    describe("processAnswers()", () => {

        describe("prompt", () => {

            beforeEach(() => {
                answers = {
                    purpose: "style",
                    source: "prompt",
                    extendDefault: true,
                    indent: 2,
                    quotes: "single",
                    linebreak: "unix",
                    semi: true,
                    moduleType: "esm",
                    es6Globals: true,
                    env: ["browser"],
                    format: "JSON"
                };
            });
            it("should throw error with message when no package.json", async () => {
                const requireStubs = {
                    "../../lib/shared/logging.js": log,
                    "../../lib/init/npm-utils.js": {
                        ...await esmock("../../lib/init/npm-utils.js", { fs: defineInMemoryFs({}) })
                    }
                };


                init = await esmock("../../lib/init/config-initializer.js", requireStubs, { });

                assert.throws(() => {
                    init.initializeConfig();
                }, "A package.json file is necessary to initialize ESLint. Run `npm init` to create a package.json file and try again.");
            });

            it("should create default config", () => {
                const config = init.processAnswers(answers);

                assert.deepStrictEqual(config.rules.indent, ["error", 2]);
                assert.deepStrictEqual(config.rules.quotes, ["error", "single"]);
                assert.deepStrictEqual(config.rules["linebreak-style"], ["error", "unix"]);
                assert.deepStrictEqual(config.rules.semi, ["error", "always"]);
                assert.strictEqual(config.env.es2021, true);
                assert.strictEqual(config.parserOptions.ecmaVersion, "latest");
                assert.strictEqual(config.parserOptions.sourceType, "module");
                assert.strictEqual(config.env.browser, true);
                assert.strictEqual(config.extends, "eslint:recommended");
            });

            it("should disable semi", () => {
                answers.semi = false;
                const config = init.processAnswers(answers);

                assert.deepStrictEqual(config.rules.semi, ["error", "never"]);
            });

            it("should enable react plugin", () => {
                answers.framework = "react";
                const config = init.processAnswers(answers);

                assert.strictEqual(config.parserOptions.ecmaFeatures.jsx, true);
                assert.strictEqual(config.parserOptions.ecmaVersion, "latest");
                assert.deepStrictEqual(config.plugins, ["react"]);
            });

            it("should enable vue plugin", () => {
                answers.framework = "vue";
                const config = init.processAnswers(answers);

                assert.strictEqual(config.parserOptions.ecmaVersion, "latest");
                assert.deepStrictEqual(config.plugins, ["vue"]);
                assert.deepStrictEqual(config.extends, ["eslint:recommended", "plugin:vue/essential"]);
            });

            it("should enable typescript parser and plugin", () => {
                answers.typescript = true;
                const config = init.processAnswers(answers);

                assert.strictEqual(config.parser, "@typescript-eslint/parser");
                assert.deepStrictEqual(config.plugins, ["@typescript-eslint"]);
                assert.deepStrictEqual(config.extends, ["eslint:recommended", "plugin:@typescript-eslint/recommended"]);
            });

            it("should enable typescript parser and plugin with vue", () => {
                answers.framework = "vue";
                answers.typescript = true;
                const config = init.processAnswers(answers);

                assert.deepStrictEqual(config.extends, ["eslint:recommended", "plugin:vue/essential", "plugin:@typescript-eslint/recommended"]);
                assert.strictEqual(config.parserOptions.parser, "@typescript-eslint/parser");
                assert.deepStrictEqual(config.plugins, ["vue", "@typescript-eslint"]);
            });

            it("should extend eslint:recommended", () => {
                const config = init.processAnswers(answers);

                assert.strictEqual(config.extends, "eslint:recommended");
            });

            it("should not use commonjs by default", () => {
                const config = init.processAnswers(answers);

                assert.isUndefined(config.env.commonjs);
            });

            it("should use commonjs when set", () => {
                answers.moduleType = "commonjs";
                const config = init.processAnswers(answers);

                assert.isTrue(config.env.commonjs);
            });
        });

        describe("guide", () => {
            it("should support the google style guide", () => {
                const config = { extends: "google" };
                const modules = init.getModulesList(config);

                assert.deepStrictEqual(config, { extends: "google", installedESLint: true });
                assert.include(modules, "eslint-config-google@latest");
            });

            it("should support the airbnb style guide", () => {
                const config = { extends: "airbnb" };
                const modules = init.getModulesList(config);

                assert.deepStrictEqual(config, { extends: "airbnb", installedESLint: true });
                assert.include(modules, "eslint-config-airbnb@latest");
            });

            it("should support the airbnb base style guide", () => {
                const config = { extends: "airbnb-base" };
                const modules = init.getModulesList(config);

                assert.deepStrictEqual(config, { extends: "airbnb-base", installedESLint: true });
                assert.include(modules, "eslint-config-airbnb-base@latest");
            });

            it("should support the standard style guide", () => {
                const config = { extends: "standard" };
                const modules = init.getModulesList(config);

                assert.deepStrictEqual(config, { extends: "standard", installedESLint: true });
                assert.include(modules, "eslint-config-standard@latest");
            });

            it("should support the xo style guide", () => {
                const config = { extends: "xo" };
                const modules = init.getModulesList(config);

                assert.deepStrictEqual(config, { extends: "xo", installedESLint: true });
                assert.include(modules, "eslint-config-xo@latest");
            });

            it("should install required sharable config", () => {
                const config = { extends: "google" };

                init.installModules(init.getModulesList(config));
                assert(npmInstallStub.calledOnce);
                assert(npmInstallStub.firstCall.args[0].some(name => name.startsWith("eslint-config-google@")));
            });

            it("should install ESLint if not installed locally", () => {
                const config = { extends: "google" };

                init.installModules(init.getModulesList(config));
                assert(npmInstallStub.calledOnce);
                assert(npmInstallStub.firstCall.args[0].some(name => name.startsWith("eslint@")));
            });

            it("should install peerDependencies of the sharable config", () => {
                const config = { extends: "airbnb" };

                init.installModules(init.getModulesList(config));

                assert(npmFetchPeerDependenciesStub.calledOnce);
                assert(npmFetchPeerDependenciesStub.firstCall.args[0] === "eslint-config-airbnb@latest");
                assert(npmInstallStub.calledOnce);
                assert.deepStrictEqual(
                    npmInstallStub.firstCall.args[0],
                    [
                        "eslint-config-airbnb@latest",
                        "eslint@^3.19.0",
                        "eslint-plugin-jsx-a11y@^5.0.1",
                        "eslint-plugin-import@^2.2.0",
                        "eslint-plugin-react@^7.0.1"
                    ]
                );
            });

            describe('hasESLintVersionConflict (Note: peerDependencies always `eslint: "^3.19.0"` by stubs)', () => {

                before(() => {

                    // FIX: not sure why it was changed somewhere???
                    process.chdir(fixtureDir);
                });

                describe("if local ESLint is not found,", () => {
                    before(() => {
                        setLocalInstalledEslint(null);
                    });

                    it("should return false.", () => {
                        const result = init.hasESLintVersionConflict({ styleguide: "airbnb" });

                        assert.strictEqual(result, false);
                    });
                });

                describe("if local ESLint is 3.19.0,", () => {
                    before(() => {
                        setLocalInstalledEslint("3.19.0");
                    });

                    it("should return false.", () => {
                        const result = init.hasESLintVersionConflict({ styleguide: "airbnb" });

                        assert.strictEqual(result, false);
                    });
                });

                describe("if local ESLint is 4.0.0,", () => {
                    before(() => {
                        setLocalInstalledEslint("4.0.0");
                    });

                    it("should return true.", () => {
                        const result = init.hasESLintVersionConflict({ styleguide: "airbnb" });

                        assert.strictEqual(result, true);
                    });
                });

                describe("if local ESLint is 3.18.0,", () => {
                    before(() => {
                        setLocalInstalledEslint("3.18.0");
                    });

                    it("should return true.", () => {
                        const result = init.hasESLintVersionConflict({ styleguide: "airbnb" });

                        assert.strictEqual(result, true);
                    });
                });
            });

            it("should support the standard style guide with Vue.js", () => {
                const config = {
                    plugins: ["vue"],
                    extends: ["plugin:vue/essential", "standard"]
                };
                const modules = init.getModulesList(config);

                assert.include(modules, "eslint-plugin-vue@latest");
                assert.include(modules, "eslint-config-standard@latest");
            });

            it("should support custom parser", () => {
                const config = {
                    parser: "@typescript-eslint/parser"
                };
                const modules = init.getModulesList(config);

                assert.include(modules, "@typescript-eslint/parser@latest");
            });

            it("should support custom parser with Vue.js", () => {
                const config = {

                    // We should declare the parser at `parserOptions` when using with `eslint-plugin-vue`.
                    parserOptions: {
                        parser: "@typescript-eslint/parser"
                    }
                };
                const modules = init.getModulesList(config);

                assert.include(modules, "@typescript-eslint/parser@latest");
            });
        });

    });

    describe("writeFile()", () => {

        beforeEach(() => {
            answers = {
                purpose: "style",
                source: "prompt",
                extendDefault: true,
                indent: 2,
                quotes: "single",
                linebreak: "unix",
                semi: true,
                moduleType: "esm",
                es6Globals: true,
                env: ["browser"],
                format: "JSON"
            };

            pkgJSONContents = {
                name: "config-initializer",
                version: "1.0.0"
            };

            process.chdir(fixtureDir);

            pkgJSONPath = path.resolve(fixtureDir, "package.json");
        });

        afterEach(() => {
            process.chdir(originalDir);
        });

        it("should create .eslintrc.json", () => {
            const config = init.processAnswers(answers);
            const filePath = path.resolve(fixtureDir, ".eslintrc.json");

            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSONContents));

            init.writeFile(config, answers.format);

            assert.isTrue(fs.existsSync(filePath));

            fs.unlinkSync(filePath);
            fs.unlinkSync(pkgJSONPath);
        });

        it("should create .eslintrc.js", async () => {
            answers.format = "JavaScript";

            const config = init.processAnswers(answers);
            const filePath = path.resolve(fixtureDir, ".eslintrc.js");

            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSONContents));

            await init.writeFile(config, answers.format);

            assert.isTrue(fs.existsSync(filePath));

            fs.unlinkSync(filePath);
            fs.unlinkSync(pkgJSONPath);
        });

        it("should create .eslintrc.yml", async () => {
            answers.format = "YAML";

            const config = init.processAnswers(answers);
            const filePath = path.resolve(fixtureDir, ".eslintrc.yml");

            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSONContents));

            await init.writeFile(config, answers.format);

            assert.isTrue(fs.existsSync(filePath));

            fs.unlinkSync(filePath);
            fs.unlinkSync(pkgJSONPath);
        });

        // For https://github.com/eslint/eslint/issues/14137
        it("should create .eslintrc.cjs", async () => {
            answers.format = "JavaScript";

            // create package.json with "type": "module"
            pkgJSONContents.type = "module";

            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSONContents));

            const config = init.processAnswers(answers);
            const filePath = path.resolve(fixtureDir, ".eslintrc.cjs");

            await init.writeFile(config, answers.format);

            assert.isTrue(fs.existsSync(filePath));

            fs.unlinkSync(filePath);
            fs.unlinkSync(pkgJSONPath);
        });

        it("should create .eslintrc.json even with type: 'module'", async () => {
            answers.format = "JSON";

            // create package.json with "type": "module"
            pkgJSONContents.type = "module";

            fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSONContents));

            const config = init.processAnswers(answers);
            const filePath = path.resolve(fixtureDir, ".eslintrc.json");

            await init.writeFile(config, answers.format);

            assert.isTrue(fs.existsSync(filePath));

            fs.unlinkSync(filePath);
            fs.unlinkSync(pkgJSONPath);
        });
    });
});
