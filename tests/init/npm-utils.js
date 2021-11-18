/**
 * @fileoverview Tests for rule fixer.
 * @author Ian VanSchooten
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import fs from "fs";
import chai from "chai";
import spawn from "cross-spawn";
import sinon from "sinon";
import * as npmUtils from "../../lib/init/npm-utils.js";
import * as log from "../../lib/shared/logging.js";
import { defineInMemoryFs } from "../_utils/index.js";

import proxyquireMod from "proxyquire";

const { assert } = chai;
const proxyquire = proxyquireMod.noCallThru().noPreserveCache();

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Import `npm-utils` with the in-memory file system.
 * @param {Object} files The file definitions.
 * @returns {void}
 */
function mockFiles(files) {
    const mfs = defineInMemoryFs({ files });
    npmUtils._setFs(mfs);
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
// TODO: make the tests passing!
describe("npmUtils", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
        npmUtils._setFs(fs);
    });

    describe("checkDevDeps()", () => {
        let installStatus;

        before(() => {
            installStatus = npmUtils.checkDevDeps(["debug", "mocha", "notarealpackage", "jshint"]);
        });

        it("should not find a direct dependency of the project", () => {
            assert.isFalse(installStatus.debug);
        });

        it("should find a dev dependency of the project", () => {
            assert.isTrue(installStatus.mocha);
        });

        it("should not find non-dependencies", () => {
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should not find nested dependencies", () => {
            assert.isFalse(installStatus.jshint);
        });

        it("should return false for a single, non-existent package", () => {
            installStatus = npmUtils.checkDevDeps(["notarealpackage"]);
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should handle missing devDependencies key", async () => {
            mockFiles({ "package.json": JSON.stringify({ private: true, dependencies: {} }) });

            // Should not throw.
            npmUtils.checkDevDeps(["some-package"]);
        });

        // TODO
        it("should throw with message when parsing invalid package.json", () => {
            mockFiles({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    npmUtils.checkDevDeps(["some-package"]);
                } catch (error) {
                    assert.strictEqual(error.messageTemplate, "failed-to-read-json");
                    throw error;
                }
            }, "SyntaxError: Unexpected token v");
        });
    });

    describe("checkDeps()", () => {
        let installStatus;

        before(() => {
            installStatus = npmUtils.checkDeps(["debug", "mocha", "notarealpackage", "jshint"]);
        });

        it("should find a direct dependency of the project", () => {
            assert.isTrue(installStatus.debug);
        });

        it("should not find a dev dependency of the project", () => {
            assert.isFalse(installStatus.mocha);
        });

        it("should not find non-dependencies", () => {
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should not find nested dependencies", () => {
            assert.isFalse(installStatus.jshint);
        });

        it("should return false for a single, non-existent package", () => {
            installStatus = npmUtils.checkDeps(["notarealpackage"]);
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should throw if no package.json can be found", () => {
            assert.throws(() => {
                installStatus = npmUtils.checkDeps(["notarealpackage"], "/fakepath");
            }, "Could not find a package.json file");
        });

        it("should handle missing dependencies key", () => {
            mockFiles({
                "package.json": JSON.stringify({ private: true, devDependencies: {} })
            });

            // Should not throw.
            npmUtils.checkDeps(["some-package"]);
        });

        it("should throw with message when parsing invalid package.json", () => {
            mockFiles({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    npmUtils.checkDeps(["some-package"]);
                } catch (error) {
                    assert.strictEqual(error.messageTemplate, "failed-to-read-json");
                    throw error;
                }
            }, "SyntaxError: Unexpected token v");
        });
    });

    describe("checkPackageJson()", () => {
        it("should return true if package.json exists", () => {
            mockFiles({
                "package.json": "{ \"file\": \"contents\" }"
            });

            assert.strictEqual(npmUtils.checkPackageJson(), true);
        });
        it("should return false if package.json does not exist", () => {
            mockFiles({});

            assert.strictEqual(npmUtils.checkPackageJson(), false);
        });
    });

    describe("installSyncSaveDev()", () => {
        it("should invoke npm to install a single desired package", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            npmUtils.installSyncSaveDev("desired-package");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["i", "--save-dev", "desired-package"]);
            stub.restore();
        });

        it("should accept an array of packages to install", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            npmUtils.installSyncSaveDev(["first-package", "second-package"]);
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["i", "--save-dev", "first-package", "second-package"]);
            stub.restore();
        });

        // TODO
        it.skip("should log an error message if npm throws ENOENT error", async () => {
            await td.replaceEsm("../../lib/shared/logging.js", {
                info: td.func(),
                error: td.func()
            });

            const sync = td.replace(spawn, "sync");
            // td.when(sync("npm", ["i", "--save-dev", "some-package"], { stdio: "inherit" })).thenReturn({ error: { code: "ENOENT" } });

            npmUtils.installSyncSaveDev("some-package");
            td.verify(log.error(), { times: 1, ignoreExtraArgs: true }); // called once
        });
    });

    describe("fetchPeerDependencies()", () => {
        it("should execute 'npm show --json <packageName> peerDependencies' command", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            npmUtils.fetchPeerDependencies("desired-package");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["show", "--json", "desired-package", "peerDependencies"]);
            stub.restore();
        });

        it("should return null if npm throws ENOENT error", () => {
            const stub = sinon.stub(spawn, "sync").returns({ error: { code: "ENOENT" } });

            const peerDependencies = npmUtils.fetchPeerDependencies("desired-package");

            assert.isNull(peerDependencies);

            stub.restore();
        });
    });
});
