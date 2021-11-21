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

import eslint from "eslint";
const { ESLint } = eslint;

import proxyquireMod from "proxyquire";
const proxyquire = proxyquireMod.noCallThru().noPreserveCache();

import esmock from "esmock";

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
    const dirname = path.dirname(new URL(import.meta.url).pathname);

    return path.resolve(dirname, "../../fixtures/config-file", filepath);
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("ConfigFile", () => {
    describe("write()", () => {
        let config;

        beforeEach(() => {
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
        });

        afterEach(() => {
            sinon.verifyAndRestore();
        });

        [
            ["JavaScript", "foo.js", espree.parse],
            ["JSON", "bar.json", JSON.parse],
            ["YAML", "foo.yaml", yaml.load],
            ["YML", "foo.yml", yaml.load]
        ].forEach(([fileType, filename, validate]) => {

            it(`should write a file through fs when a ${fileType} path is passed`, async () => {
                const fakeFS = {
                    writeFileSync: () => {}
                };

                sinon.mock(fakeFS).expects("writeFileSync").withExactArgs(
                    filename,
                    sinon.match(value => !!validate(value)),
                    "utf8"
                );

                const StubbedConfigFile = await esmock("../../lib/init/config-file.js", {
                    fs: fakeFS
                });

                await StubbedConfigFile.write(config, filename);
            });

            it("should include a newline character at EOF", async () => {
                const fakeFS = {
                    writeFileSync: () => {}
                };

                sinon.mock(fakeFS).expects("writeFileSync").withExactArgs(
                    filename,
                    sinon.match(value => value.endsWith("\n")),
                    "utf8"
                );

                const StubbedConfigFile = await esmock("../../lib/init/config-file.js", {
                    fs: fakeFS
                });

                await StubbedConfigFile.write(config, filename);
            });
        });

        it("should make sure js config files match linting rules", async () => {
            const fakeFS = {
                writeFileSync: () => {}
            };

            const singleQuoteConfig = {
                rules: {
                    quotes: [2, "single"]
                }
            };

            sinon.mock(fakeFS).expects("writeFileSync").withExactArgs(
                "test-config.js",
                sinon.match(value => !value.includes('"')),
                "utf8"
            );

            const StubbedConfigFile = await esmock("../../lib/init/config-file.js", {
                fs: fakeFS
            });

            StubbedConfigFile.write(singleQuoteConfig, "test-config.js");
        });

        // TODO: seems esmock cannot mock "eslint"(maybe import()/cjs?)
        it.skip("should still write a js config file even if linting fails", async () => {
            const fakeFS = {
                writeFileSync: () => {}
            };
            const fakeESLint = sinon.mock().withExactArgs(sinon.match({
                baseConfig: config,
                fix: true,
                useEslintrc: false
            }));

            Object.defineProperties(fakeESLint.prototype, Object.getOwnPropertyDescriptors(ESLint.prototype));
            sinon.stub(fakeESLint.prototype, "lintText").throws();

            sinon.mock(fakeFS).expects("writeFileSync").once();

            const StubbedConfigFile = await esmock("../../lib/init/config-file.js", {
                fs: fakeFS,
                eslint: { default: { ESLint: fakeESLint } }
            });

            nodeAssert.rejects(async () => {
                await StubbedConfigFile.write(config, "test-config.js");
            });
        });

        it("should throw error if file extension is not valid", () => {
            nodeAssert.rejects(async () => {
                await ConfigFile.write({}, getFixturePath("yaml/.eslintrc.class"));
            }, /write to unknown file type/u);
        });
    });
});
