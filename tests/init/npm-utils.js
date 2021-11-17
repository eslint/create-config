/**
 * @fileoverview Tests for rule fixer.
 * @author Ian VanSchooten
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

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
 * @returns {Object} `npm-utils`.
 */
function requireNpmUtilsWithInMemoryFileSystem(files) {
    const fs = defineInMemoryFs({ files });

    return proxyquire("../../lib/init/npm-utils.js", { fs });
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
// TODO: make the tests passing!
describe("npmUtils", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
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

        // TODO
        it.skip("should handle missing devDependencies key", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, dependencies: {} })
            });

            // Should not throw.
            stubbedNpmUtils.checkDevDeps(["some-package"]);
        });

        // TODO
        it.skip("should throw with message when parsing invalid package.json", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    stubbedNpmUtils.checkDevDeps(["some-package"]);
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

        // TODO
        it.skip("should handle missing dependencies key", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, devDependencies: {} })
            });

            // Should not throw.
            stubbedNpmUtils.checkDeps(["some-package"]);
        });

        // TODO
        it.skip("should throw with message when parsing invalid package.json", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    stubbedNpmUtils.checkDeps(["some-package"]);
                } catch (error) {
                    assert.strictEqual(error.messageTemplate, "failed-to-read-json");
                    throw error;
                }
            }, "SyntaxError: Unexpected token v");
        });
    });

    describe("checkPackageJson()", () => {
        // TODO
        it.skip("should return true if package.json exists", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"file\": \"contents\" }"
            });

            assert.strictEqual(stubbedNpmUtils.checkPackageJson(), true);
        });

        // TODO
        it.skip("should return false if package.json does not exist", () => {
            const stubbedNpmUtils = requireNpmUtilsWithInMemoryFileSystem({});

            assert.strictEqual(stubbedNpmUtils.checkPackageJson(), false);
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
        it.skip("should log an error message if npm throws ENOENT error", () => {
            const logErrorStub = sinon.stub(log, "error");
            const npmUtilsStub = sinon.stub(spawn, "sync").returns({ error: { code: "ENOENT" } });

            npmUtils.installSyncSaveDev("some-package");

            assert(logErrorStub.calledOnce);

            logErrorStub.restore();
            npmUtilsStub.restore();
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
