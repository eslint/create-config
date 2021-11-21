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
import {
    installSyncSaveDev,
    fetchPeerDependencies,
    findPackageJson,
    checkDeps,
    checkDevDeps,
    checkPackageJson
} from "../../lib/init/npm-utils.js";
import * as log from "../../lib/shared/logging.js";
import { defineInMemoryFs } from "../_utils/index.js";
import esmock from "esmock";

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
async function requireNpmUtilsWithInMemoryFileSystem(files) {
    const fs = defineInMemoryFs({ files });

    return await esmock("../../lib/init/npm-utils.js", { fs });
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("npmUtils", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });

    describe("checkDevDeps()", () => {
        let installStatus;

        before(() => {
            installStatus = checkDevDeps(["debug", "mocha", "notarealpackage", "jshint"]);
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
            installStatus = checkDevDeps(["notarealpackage"]);
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should handle missing devDependencies key", async () => {
            const { checkDevDeps: stubcheckDevDeps } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, dependencies: {} })
            });

            // Should not throw.
            stubcheckDevDeps(["some-package"]);
        });

        it("should throw with message when parsing invalid package.json", async () => {
            const { checkDevDeps: stubcheckDevDeps } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    stubcheckDevDeps(["some-package"]);
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
            installStatus = checkDeps(["debug", "mocha", "notarealpackage", "jshint"]);
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
            installStatus = checkDeps(["notarealpackage"]);
            assert.isFalse(installStatus.notarealpackage);
        });

        it("should throw if no package.json can be found", () => {
            assert.throws(() => {
                installStatus = checkDeps(["notarealpackage"], "/fakepath");
            }, "Could not find a package.json file");
        });

        it("should handle missing dependencies key", async () => {
            const { checkDeps: stubbedcheckDeps } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, devDependencies: {} })
            });

            // Should not throw.
            stubbedcheckDeps(["some-package"]);
        });

        it("should throw with message when parsing invalid package.json", async () => {
            const { checkDeps: stubbedcheckDeps } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"not: \"valid json\" }"
            });

            assert.throws(() => {
                try {
                    stubbedcheckDeps(["some-package"]);
                } catch (error) {
                    assert.strictEqual(error.messageTemplate, "failed-to-read-json");
                    throw error;
                }
            }, "SyntaxError: Unexpected token v");
        });
    });

    describe("checkPackageJson()", () => {
        it("should return true if package.json exists", async () => {
            const { checkPackageJson: stubbedcheckPackageJson } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": "{ \"file\": \"contents\" }"
            });

            assert.strictEqual(stubbedcheckPackageJson(), true);
        });

        it("should return false if package.json does not exist", async () => {
            const { checkPackageJson: stubbedcheckPackageJson } = await requireNpmUtilsWithInMemoryFileSystem({});

            assert.strictEqual(stubbedcheckPackageJson(), false);
        });
    });

    describe("installSyncSaveDev()", () => {
        it("should invoke npm to install a single desired package", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            installSyncSaveDev("desired-package");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["i", "--save-dev", "desired-package"]);
            stub.restore();
        });

        it("should accept an array of packages to install", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            installSyncSaveDev(["first-package", "second-package"]);
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["i", "--save-dev", "first-package", "second-package"]);
            stub.restore();
        });

        it("should log an error message if npm throws ENOENT error", async () => {
            const logErrorStub = sinon.stub();
            const { installSyncSaveDev: stubbedinstallSyncSaveDev } = await esmock("../../lib/init/npm-utils.js", {
                "../../lib/shared/logging.js": {
                    error: logErrorStub
                }
            });

            const npmUtilsStub = sinon.stub(spawn, "sync").returns({ error: { code: "ENOENT" } });

            stubbedinstallSyncSaveDev("some-package");

            assert(logErrorStub.calledOnce);

            npmUtilsStub.restore();
        });
    });

    describe("fetchPeerDependencies()", () => {
        it("should execute 'npm show --json <packageName> peerDependencies' command", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            fetchPeerDependencies("desired-package");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["show", "--json", "desired-package", "peerDependencies"]);
            stub.restore();
        });

        it("should return null if npm throws ENOENT error", () => {
            const stub = sinon.stub(spawn, "sync").returns({ error: { code: "ENOENT" } });

            const peerDependencies = fetchPeerDependencies("desired-package");

            assert.isNull(peerDependencies);

            stub.restore();
        });
    });
});
