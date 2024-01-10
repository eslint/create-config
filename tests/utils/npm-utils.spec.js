/**
 * @fileoverview Tests for npm-utils.
 * @author Ian VanSchooten, 唯然<weiran.zsd@outlook.com>
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import spawn from "cross-spawn";
import sinon from "sinon";
import {
    installSyncSaveDev,
    fetchPeerDependencies,
    checkDeps,
    checkDevDeps
} from "../../lib/utils/npm-utils.js";
import { defineInMemoryFs } from "../_utils/in-memory-fs.js";
import esmock from "esmock";
import { assert, describe, afterEach, it } from "vitest";

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

    return await esmock("../../lib/utils/npm-utils.js", { fs });
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("npmUtils", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });

    describe("checkDevDeps()", () => {
        let installStatus = checkDevDeps(["debug", "mocha", "notarealpackage", "jshint"]);

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
                "package.json": '{ "not: "valid json" }'
            });

            assert.throws(() => {
                stubcheckDevDeps(["some-package"]);
            }, /JSON/u);
        });
    });

    describe("checkDeps()", () => {
        let installStatus = checkDeps(["debug", "mocha", "notarealpackage", "jshint"]);

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
                "package.json": '{ "not: "valid json" }'
            });

            assert.throws(() => {
                stubbedcheckDeps(["some-package"]);
            }, /JSON/u);
        });
    });

    describe("checkPackageJson()", () => {
        it("should return true if package.json exists", async () => {
            const { checkPackageJson: stubbedcheckPackageJson } = await requireNpmUtilsWithInMemoryFileSystem({
                "package.json": '{ "file": "contents" }'
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

            installSyncSaveDev("desired-package", "npm");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["install", "-D", "desired-package"]);
            stub.restore();
        });

        it("should invoke yarn to install a single desired package", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            installSyncSaveDev("desired-package", "yarn");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "yarn");
            assert.deepStrictEqual(stub.firstCall.args[1], ["add", "-D", "desired-package"]);
            stub.restore();
        });


        it("should accept an array of packages to install", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            installSyncSaveDev(["first-package", "second-package"], "npm");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "npm");
            assert.deepStrictEqual(stub.firstCall.args[1], ["install", "-D", "first-package", "second-package"]);
            stub.restore();
        });

        it("should log an error message if npm throws ENOENT error", async () => {
            const logErrorStub = sinon.spy();
            const npmUtilsStub = sinon.stub(spawn, "sync").returns({ error: { code: "ENOENT" } });

            const { installSyncSaveDev: stubinstallSyncSaveDev } = await esmock("../../lib/utils/npm-utils.js", {
                "../../lib/utils/logging.js": {
                    error: logErrorStub
                }
            });

            stubinstallSyncSaveDev("some-package");

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
