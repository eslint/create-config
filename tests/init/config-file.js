/**
 * @fileoverview Tests for ConfigFile
 * @author Nicholas C. Zakas
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import sinon from "sinon";
import path from "path";
import yaml from "js-yaml";
import * as espree from "espree";
import * as ConfigFile from "../../lib/init/config-file.js";
import nodeAssert from "assert";
import fs from "fs";

import eslint from "eslint";
const { ESLint } = eslint;

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Helper function get easily get a path in the fixtures directory.
 * @param {string} filepath The path to find in the fixtures directory.
 * @returns {string} Full path in the fixtures directory.
 * @private
 */
function getFixturePath(filepath) {
    return path.resolve(__dirname, "../../fixtures/config-file", filepath);
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("ConfigFile", () => {
    let writeFileSync;
    let ConfigFile;

    beforeEach(async () => {

    });

    describe("write()", () => {
        let config;

        beforeEach(async () => {
            config = {
                env: {
                    browser: true,
                    node: true
                },
                rules: {
                    quotes: 2,
                    semi: 1
                }
            };
            writeFileSync = td.replace(fs, "writeFileSync");
            ConfigFile = await import("../../lib/init/config-file.js");
        });

        [
            ["JavaScript", "foo.js", espree.parse],
            ["JSON", "bar.json", JSON.parse],
            ["YAML", "foo.yaml", yaml.load],
            ["YML", "foo.yml", yaml.load]
        ].forEach(([fileType, filename, validate]) => {

            it(`should write a file through fs when a ${fileType} path is passed`, async () => {
                await ConfigFile.write(config, filename);
                td.verify(writeFileSync(filename, td.matchers.argThat(value => !!validate(value)), "utf8"));
            });

            it("should include a newline character at EOF", async () => {
                await ConfigFile.write(config, filename);
                td.verify(writeFileSync(filename, td.matchers.argThat(value => value.endsWith("\n")), "utf8"));
            });
        });

        it("should make sure js config files match linting rules", async () => {

            const singleQuoteConfig = {
                rules: {
                    quotes: [2, "single"]
                }
            };

            await ConfigFile.write(singleQuoteConfig, "test-config.js");
            td.verify(writeFileSync("test-config.js", td.matchers.argThat(value => !value.includes("\"")), "utf8"));
        });

        // TODO: confirm the test was working as expected.
        it("should still write a js config file even if linting fails", () => {
            nodeAssert.rejects(async () => {
                try {
                    await ConfigFile.write(config, "test-config.js");
                } catch (e) {
                    td.verify(writeFileSync(), { times: 1, ignoreExtraArgs: true }); // called once
                    throw e;
                }
            });
        });

        it("should throw error if file extension is not valid", () => {
            nodeAssert.rejects(async () => {
                await ConfigFile.write({}, getFixturePath("yaml/.eslintrc.class"));
            }, /write to unknown file type/u);
        });
    });
});
