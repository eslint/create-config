/**
 * @fileoverview snapshot tests for config-generator.js
 * run `npm run test:snapshots` to assert snapshots
 * run `npm run test:snapshots:update` to update snapshots - you need
 * to check the changes manually (see the diff) and make sure it's correct.
 *
 * @author 唯然<weiran.zsd@outlook.com>
 */
import { ConfigGenerator } from "../lib/config-generator.js";
import { expect, describe, test } from "vitest";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle -- commonjs convention

describe("generate config for esm projects", () => {
    const esmProjectDir = join(__filename, "../fixtures/esm-project");
    const choices = {
        purpose: ["syntax", "problems"],
        moduleType: ["esm", "commonjs", "script"],
        framework: ["react", "vue", "none"],
        useTs: [false, true],
        env: ["browser", "node"]
    };

    const inputs = [
        { name: "esm-json-syntax", answers: { languages: ["json"], purpose: "syntax" } },
        { name: "esm-json-problems", answers: { languages: ["json"], purpose: "problems" } },
        { name: "esm-json5-syntax", answers: { languages: ["json5"], purpose: "syntax" } },
        { name: "esm-json5-problems", answers: { languages: ["json5"], purpose: "problems" } },
        { name: "esm-jsonc-syntax", answers: { languages: ["jsonc"], purpose: "syntax" } },
        { name: "esm-jsonc-problems", answers: { languages: ["jsonc"], purpose: "problems" } },
        { name: "esm-markdown-commonmark-syntax", answers: { languages: ["md"], mdType: "commonmark", purpose: "syntax" } },
        { name: "esm-markdown-commonmark-problems", answers: { languages: ["md"], mdType: "commonmark", purpose: "problems" } },
        { name: "esm-markdown-gfm-syntax", answers: { languages: ["md"], mdType: "gfm", purpose: "syntax" } },
        { name: "esm-markdown-gfm-problems", answers: { languages: ["md"], mdType: "gfm", purpose: "problems" } },
        { name: "esm-javascript-json-problems", answers: { languages: ["javascript", "json"], purpose: "problems", moduleType: "esm", framework: "none", useTs: false, env: ["node"] } },
        { name: "esm-css-syntax", answers: { languages: ["css"], purpose: "syntax" } },
        { name: "esm-css-problems", answers: { languages: ["css"], purpose: "problems" } },
        { name: "esm-configfile-js", answers: { languages: ["javascript"], purpose: "problems", moduleType: "esm", framework: "none", useTs: true, configFileLanguage: "js", env: ["node"] } },
        { name: "esm-configfile-ts", answers: { languages: ["javascript"], purpose: "problems", moduleType: "esm", framework: "none", useTs: true, configFileLanguage: "ts", addJiti: false, env: ["node"] } },
        { name: "esm-configfile-ts-jiti", answers: { languages: ["javascript"], purpose: "problems", moduleType: "esm", framework: "none", useTs: true, configFileLanguage: "ts", addJiti: true, env: ["node"] } }
    ];

    // generate all possible combinations
    for (let i = 0; i < choices.purpose.length; i++) {
        for (let j = 0; j < choices.moduleType.length; j++) {
            for (let k = 0; k < choices.framework.length; k++) {
                for (let m = 0; m < choices.useTs.length; m++) {
                    inputs.push({
                        name: `${choices.purpose[i]}-${choices.moduleType[j]}-${choices.framework[k]}-${choices.useTs[m] ? "typescript" : "javascript"}`,
                        answers: {
                            purpose: choices.purpose[i],
                            moduleType: choices.moduleType[j],
                            framework: choices.framework[k],
                            useTs: choices.useTs[m],
                            env: ["browser", "node"]
                        }
                    });
                }
            }
        }
    }

    // add a combination that should produce an empty config
    inputs.push({
        name: "empty",
        answers: {
            purpose: "syntax",
            moduleType: "esm",
            framework: "none",
            language: "javascript",
            env: []
        }
    });

    inputs.forEach(item => {
        test(`${item.name}`, async () => {
            const generator = new ConfigGenerator({ cwd: esmProjectDir, answers: item.answers });

            await generator.calc();

            const expectedExtension = item.answers.configFileLanguage === "ts" ? "ts" : "js";

            expect(generator.result.configFilename).toBe(`eslint.config.${expectedExtension}`);
            expect(generator.packageJsonPath).toBe(join(esmProjectDir, "./package.json"));
            expect(generator.result.configContent.endsWith("\n")).toBe(true);
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });

    test("sub dir", async () => {
        const sub = join(__filename, "../fixtures/esm-project/sub");
        const generator = new ConfigGenerator({ cwd: sub, answers: { purpose: "problems", moduleType: "esm", framework: "none", useTs: false, env: ["node"] } });

        await generator.calc();

        expect(generator.result.configFilename).toBe("eslint.config.js");
        expect(generator.packageJsonPath).toBe(join(esmProjectDir, "./package.json"));
    });

});

describe("generate config for cjs projects", () => {
    const cjsProjectDir = join(__filename, "../fixtures/cjs-project");
    const inputs = [{
        name: "config@eslint-config-xo",
        answers: {
            config: { packageName: "eslint-config-xo", type: "flat" }
        }
    },
    {
        name: "config@eslint-config-airbnb-base",
        answers: {
            config: { packageName: "eslint-config-airbnb-base", type: "eslintrc" }
        }
    }, {
        name: "config@eslint-config-airbnb",
        answers: {
            config: { packageName: "eslint-config-airbnb", type: "eslintrc" }
        }
    }, {
        name: "config@eslint-config-standard",
        answers: {
            config: { packageName: "eslint-config-standard", type: "eslintrc" }
        }
    }, {
        name: "config@eslint-config-standard-flat",
        answers: {
            config: { packageName: "eslint-config-standard", type: "flat" }
        }
    }, {
        name: "config@eslint-config-standard-flat2",
        answers: {
            config: "eslint-config-standard"
        }
    },
    { name: "cjs-configfile-js", answers: { languages: ["javascript"], purpose: "problems", moduleType: "commonjs", framework: "none", useTs: true, configFileLanguage: "js", env: ["node"] } },
    { name: "cjs-configfile-ts", answers: { languages: ["javascript"], purpose: "problems", moduleType: "commonjs", framework: "none", useTs: true, configFileLanguage: "ts", addJiti: false, env: ["node"] } },
    { name: "cjs-configfile-ts-jiti", answers: { languages: ["javascript"], purpose: "problems", moduleType: "commonjs", framework: "none", useTs: true, configFileLanguage: "ts", addJiti: true, env: ["node"] } }];

    inputs.forEach(item => {
        test(`${item.name}`, async () => {
            const generator = new ConfigGenerator({ cwd: cjsProjectDir, answers: item.answers });

            await generator.calc();

            const expectedExtension = item.answers.configFileLanguage === "ts" ? "mts" : "mjs";

            expect(generator.result.configFilename).toBe(`eslint.config.${expectedExtension}`);
            expect(generator.packageJsonPath).toBe(join(cjsProjectDir, "./package.json"));
            expect(generator.result.configContent.endsWith("\n")).toBe(true);
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });
});
