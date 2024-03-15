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
import { join } from "path";

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle -- commonjs convention

describe("generate config for esm projects", () => {
    const esmProjectDir = join(__filename, "../fixtures/esm-project");
    const choices = {
        purpose: ["syntax", "problem"],
        module: ["esm", "commonjs", "script"],
        framework: ["react", "vue", "none"],
        language: ["javascript", "typescript"],
        env: ["browser", "node"]
    };

    const inputs = [];

    // generate all possible combinations
    for (let i = 0; i < choices.purpose.length; i++) {
        for (let j = 0; j < choices.module.length; j++) {
            for (let k = 0; k < choices.framework.length; k++) {
                for (let m = 0; m < choices.language.length; m++) {
                    inputs.push({
                        name: `${choices.purpose[i]}-${choices.module[j]}-${choices.framework[k]}-${choices.language[m]}`,
                        answers: {
                            purpose: choices.purpose[i],
                            module: choices.module[j],
                            framework: choices.framework[k],
                            language: choices.language[m],
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
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });

    test("sub dir", () => {
        const sub = join(__filename, "../fixtures/esm-project/sub");
        const generator = new ConfigGenerator({ cwd: sub, answers: { purpose: "problem", module: "esm", framework: "none", language: "javascript", env: ["node"] } });

        generator.calc();

        expect(generator.result.configFilename).toBe("eslint.config.js");
    });

});

describe("generate config for cjs projects", () => {
    const cjsProjectDir = join(__filename, "../fixtures/cjs-project");
    const inputs = [{
        name: "style-esm-none-xo-javascript",
        answers: {
            purpose: "style",
            module: "esm",
            framework: "none",
            language: "javascript",
            env: ["node"],
            styleguide: { packageName: "eslint-config-xo", type: "eslintrc" }
        }
    },
    {
        name: "style-esm-none-xo-typescript",
        answers: {
            purpose: "style",
            module: "esm",
            framework: "none",
            language: "typescript",
            env: ["browser"],
            styleguide: { packageName: "eslint-config-xo-typescript", type: "eslintrc" }
        }
    }];

    inputs.forEach(item => {
        test(`${item.name}`, () => {
            const generator = new ConfigGenerator({ cwd: cjsProjectDir, answers: item.answers });

            generator.calc();

            expect(generator.result.configFilename).toBe("eslint.config.mjs");
            expect(generator.result).toMatchFileSnapshot(`./__snapshots__/${item.name}`);
        });
    });
});
