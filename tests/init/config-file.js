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

        it("should run 'eslint --fix' to make sure js config files match linting rules", async () => {
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
                sinon.match.string,
                "utf8"
            );

            const syncStub = sinon.fake();
            const StubbedConfigFile = await esmock("../../lib/init/config-file.js", {
                fs: fakeFS,
                "cross-spawn": {
                    default: {
                        sync: syncStub
                    }
                }
            });

            StubbedConfigFile.write(singleQuoteConfig, "test-config.js");
            nodeAssert(syncStub.called);
            nodeAssert(syncStub.calledWith(
                sinon.match("eslint"),
                sinon.match.array.contains(["--fix"])
            ));
        });

        it("should throw error if file extension is not valid", () => {
            nodeAssert.rejects(async () => {
                await ConfigFile.write({}, getFixturePath("yaml/.eslintrc.class"));
            }, /write to unknown file type/u);
        });
    });
});
