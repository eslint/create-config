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
    checkDevDeps,
    checkPackageJson
} from "../../lib/utils/npm-utils.js";
import { defineInMemoryFs } from "../_utils/in-memory-fs.js";
import { assert, describe, afterEach, it } from "vitest";
import fs from "node:fs";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Replace native fs methods with the in-memory file system methods used by `npm-utils`.
 * @param {Object} files The file definitions.
 * @returns {void}
 */
async function useInMemoryFileSystem(files) {
    const inMemoryFs = defineInMemoryFs({ files });

    sinon.replace(fs, "readFileSync", inMemoryFs.readFileSync);
    sinon.replace(fs, "existsSync", inMemoryFs.existsSync);
    sinon.replace(fs, "statSync", inMemoryFs.statSync);
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("npmUtils", () => {
    afterEach(() => {
        sinon.verifyAndRestore();
    });

    describe("checkDevDeps()", () => {
        let installStatus = checkDevDeps(["debug", "eslint", "notarealpackage", "jshint"]);

        it("should not find a direct dependency of the project", () => {
            assert.isFalse(installStatus.debug);
        });

        it("should find a dev dependency of the project", () => {
            assert.isTrue(installStatus.eslint);
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
            await useInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, dependencies: {} })
            });

            // Should not throw.
            checkDevDeps(["some-package"]);
        });

        it("should throw with message when parsing invalid package.json", async () => {
            await useInMemoryFileSystem({
                "package.json": '{ "not: "valid json" }'
            });

            assert.throws(() => {
                checkDevDeps(["some-package"]);
            }, /JSON/u);
        });
    });

    describe("checkDeps()", () => {
        let installStatus = checkDeps(["enquirer", "mocha", "notarealpackage", "jshint"]);

        it("should find a direct dependency of the project", () => {
            assert.isTrue(installStatus.enquirer);
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
            await useInMemoryFileSystem({
                "package.json": JSON.stringify({ private: true, devDependencies: {} })
            });

            // Should not throw.
            checkDeps(["some-package"]);
        });

        it("should throw with message when parsing invalid package.json", async () => {
            await useInMemoryFileSystem({
                "package.json": '{ "not: "valid json" }'
            });

            assert.throws(() => {
                checkDeps(["some-package"]);
            }, /JSON/u);
        });
    });

    describe("checkPackageJson()", () => {
        it("should return true if package.json exists", async () => {
            await useInMemoryFileSystem({
                "package.json": '{ "file": "contents" }'
            });

            assert.strictEqual(checkPackageJson(), true);
        });

        it("should return false if package.json does not exist", async () => {
            await useInMemoryFileSystem({});

            assert.strictEqual(checkPackageJson(), false);
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
            const log = await import("../../lib/utils/logging.js");

            sinon.replaceGetter(log, "error", () => logErrorStub);

            installSyncSaveDev("some-package");

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
