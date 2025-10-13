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
    checkPackageJson,
    parsePackageName
} from "../../lib/utils/npm-utils.js";
import { defineInMemoryFs } from "../_utils/in-memory-fs.js";
import { assert, describe, afterEach, it, expect } from "vitest";
import fs from "node:fs";
import process from "node:process";

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

        it("should invoke bun to install a single desired package", () => {
            const stub = sinon.stub(spawn, "sync").returns({ stdout: "" });

            installSyncSaveDev("desired-package", "bun");
            assert(stub.calledOnce);
            assert.strictEqual(stub.firstCall.args[0], "bun");
            assert.deepStrictEqual(stub.firstCall.args[1], ["install", "-D", "desired-package"]);
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

    describe("parsePackageName()", () => {
        it("should parse package name with version", () => {
            const result = parsePackageName("eslint@9.0.0");

            assert.deepStrictEqual(result, { name: "eslint", version: "9.0.0" });
        });

        it("should parse package name without version", () => {
            const result = parsePackageName("eslint");

            assert.deepStrictEqual(result, { name: "eslint", version: "latest" });
        });

        it("should handle scoped packages with version", () => {
            const result = parsePackageName("@typescript-eslint/eslint-plugin@5.0.0");

            assert.deepStrictEqual(result, { name: "@typescript-eslint/eslint-plugin", version: "5.0.0" });
        });

        it("should handle scoped packages without version", () => {
            const result = parsePackageName("@typescript-eslint/eslint-plugin");

            assert.deepStrictEqual(result, { name: "@typescript-eslint/eslint-plugin", version: "latest" });
        });
    });

    describe("fetchPeerDependencies()", () => {

        // Skip on Node.js v21 due to a bug where fetch cannot be stubbed
        // See: https://github.com/sinonjs/sinon/issues/2590
        it.skipIf(process.version.startsWith("v21"))("should fetch peer dependencies from npm registry", async () => {
            const fetchStub = sinon.stub(globalThis, "fetch");

            const mockResponse = {
                json: sinon.stub().resolves({
                    "dist-tags": { latest: "9.0.0" },
                    versions: {
                        "9.0.0": {
                            peerDependencies: { eslint: "9.0.0" }
                        }
                    }
                }),
                ok: true,
                status: 200
            };

            fetchStub.resolves(mockResponse);

            const result = await fetchPeerDependencies("desired-package");

            assert(fetchStub.calledOnceWith("https://registry.npmjs.org/desired-package"));
            assert.deepStrictEqual(result, ["eslint@9.0.0"]);

            fetchStub.restore();
        });

        it("should throw if an error is thrown", async () => {
            const stub = sinon.stub(globalThis, "fetch");

            const mockResponse = {
                json: sinon.stub().resolves({ error: "Not found" }),
                ok: false,
                status: 404
            };

            stub.resolves(mockResponse);

            expect(async () => await fetchPeerDependencies("desired-package")).rejects.toThrowError();

            stub.restore();
        });
    });
});
