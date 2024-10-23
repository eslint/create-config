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

    const inputs = [];

    // generate all possible combinations
    for (let i = 0; i < choices.purpose.length; i++) {
        for (let j = 0; j < choices.moduleType.length; j++) {
            for (let k = 0; k < choices.framework.length; k++) {
                for (let m = 0; m < choices.useTs.length; m++) {
                    inputs.push({
                        name: `${choices.purpose[i]}-${choices.moduleType[j]}-${choices.framework[k]}-${choices.useTs[m] ? "typescript" : "javascript"}`,
                        answers: {
                            languages: ["javascript"],
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

    inputs.forEach(item => {
        test(`${item.name}`, () => {
            const generator = new ConfigGenerator({ cwd: esmProjectDir, answers: item.answers });

            generator.calc();

            expect(generator.result.configFilename).toBe("eslint.config.js");
            expect(generator.packageJsonPath).toBe(join(esmProjectDir, "./package.json"));
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });

    test("sub dir", () => {
        const sub = join(__filename, "../fixtures/esm-project/sub");
        const generator = new ConfigGenerator({ cwd: sub, answers: { languages: ["javascript"], purpose: "problems", moduleType: "esm", framework: "none", useTs: false, env: ["node"] } });

        generator.calc();

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
    }];

    inputs.forEach(item => {
        test(`${item.name}`, () => {
            const generator = new ConfigGenerator({ cwd: cjsProjectDir, answers: item.answers });

            generator.calc();

            expect(generator.result.configFilename).toBe("eslint.config.mjs");
            expect(generator.packageJsonPath).toBe(join(cjsProjectDir, "./package.json"));
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });
});
