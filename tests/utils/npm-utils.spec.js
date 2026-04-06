/**
 * @fileoverview Tests for npm-utils.
 * @author Ian VanSchooten, 唯然<weiran.zsd@outlook.com>
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import spawn from "cross-spawn";
import {
	installSyncSaveDev,
	fetchPeerDependencies,
	checkDeps,
	checkDevDeps,
	checkPackageJson,
	parsePackageName,
} from "../../lib/utils/npm-utils.js";
import { defineInMemoryFs } from "../_utils/in-memory-fs.js";
import { assert, describe, afterEach, it, expect, vi } from "vitest";
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

	vi.spyOn(fs, "readFileSync").mockImplementation(inMemoryFs.readFileSync);
	vi.spyOn(fs, "existsSync").mockImplementation(inMemoryFs.existsSync);
	vi.spyOn(fs, "statSync").mockImplementation(inMemoryFs.statSync);
}

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("npmUtils", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkDevDeps()", () => {
		let installStatus = checkDevDeps([
			"debug",
			"eslint",
			"notarealpackage",
			"jshint",
		]);

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
				"package.json": JSON.stringify({
					private: true,
					dependencies: {},
				}),
			});

			// Should not throw.
			checkDevDeps(["some-package"]);
		});

		it("should throw with message when parsing invalid package.json", async () => {
			await useInMemoryFileSystem({
				"package.json": '{ "not: "valid json" }',
			});

			assert.throws(() => {
				checkDevDeps(["some-package"]);
			}, /JSON/u);
		});
	});

	describe("checkDeps()", () => {
		let installStatus = checkDeps([
			"enquirer",
			"mocha",
			"notarealpackage",
			"jshint",
		]);

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
				"package.json": JSON.stringify({
					private: true,
					devDependencies: {},
				}),
			});

			// Should not throw.
			checkDeps(["some-package"]);
		});

		it("should throw with message when parsing invalid package.json", async () => {
			await useInMemoryFileSystem({
				"package.json": '{ "not: "valid json" }',
			});

			assert.throws(() => {
				checkDeps(["some-package"]);
			}, /JSON/u);
		});
	});

	describe("checkPackageJson()", () => {
		it("should return true if package.json exists", async () => {
			await useInMemoryFileSystem({
				"package.json": '{ "file": "contents" }',
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
			const stub = vi
				.spyOn(spawn, "sync")
				.mockReturnValue({ stdout: "" });

			installSyncSaveDev("desired-package", "npm");
			assert.strictEqual(stub.mock.calls.length, 1);
			assert.strictEqual(stub.mock.calls[0][0], "npm");
			assert.deepStrictEqual(stub.mock.calls[0][1], [
				"install",
				"-D",
				"desired-package",
			]);
		});

		it("should invoke yarn to install a single desired package", () => {
			const stub = vi
				.spyOn(spawn, "sync")
				.mockReturnValue({ stdout: "" });

			installSyncSaveDev("desired-package", "yarn");
			assert.strictEqual(stub.mock.calls.length, 1);
			assert.strictEqual(stub.mock.calls[0][0], "yarn");
			assert.deepStrictEqual(stub.mock.calls[0][1], [
				"add",
				"-D",
				"desired-package",
			]);
		});

		it("should invoke bun to install a single desired package", () => {
			const stub = vi
				.spyOn(spawn, "sync")
				.mockReturnValue({ stdout: "" });

			installSyncSaveDev("desired-package", "bun");
			assert.strictEqual(stub.mock.calls.length, 1);
			assert.strictEqual(stub.mock.calls[0][0], "bun");
			assert.deepStrictEqual(stub.mock.calls[0][1], [
				"install",
				"-D",
				"desired-package",
			]);
		});

		it("should accept an array of packages to install", () => {
			const stub = vi
				.spyOn(spawn, "sync")
				.mockReturnValue({ stdout: "" });

			installSyncSaveDev(["first-package", "second-package"], "npm");
			assert.strictEqual(stub.mock.calls.length, 1);
			assert.strictEqual(stub.mock.calls[0][0], "npm");
			assert.deepStrictEqual(stub.mock.calls[0][1], [
				"install",
				"-D",
				"first-package",
				"second-package",
			]);
		});

		it("should log an error message if npm throws ENOENT error", async () => {
			vi.spyOn(spawn, "sync").mockReturnValue({
				error: { code: "ENOENT" },
			});
			const log = await import("../../lib/utils/logging.js");
			const logErrorStub = vi
				.spyOn(log, "error")
				.mockImplementation(() => {});

			installSyncSaveDev("some-package");

			assert.strictEqual(logErrorStub.mock.calls.length, 1);
		});
	});

	describe("parsePackageName()", () => {
		it("should parse package name with version", () => {
			const result = parsePackageName("eslint@9.0.0");

			assert.deepStrictEqual(result, {
				name: "eslint",
				version: "9.0.0",
			});
		});

		it("should parse package name without version", () => {
			const result = parsePackageName("eslint");

			assert.deepStrictEqual(result, {
				name: "eslint",
				version: "latest",
			});
		});

		it("should handle scoped packages with version", () => {
			const result = parsePackageName(
				"@typescript-eslint/eslint-plugin@5.0.0",
			);

			assert.deepStrictEqual(result, {
				name: "@typescript-eslint/eslint-plugin",
				version: "5.0.0",
			});
		});

		it("should handle scoped packages without version", () => {
			const result = parsePackageName("@typescript-eslint/eslint-plugin");

			assert.deepStrictEqual(result, {
				name: "@typescript-eslint/eslint-plugin",
				version: "latest",
			});
		});
	});

	describe("fetchPeerDependencies()", () => {
		// Skip on Node.js v21 due to a bug where fetch cannot be stubbed
		// See: https://github.com/sinonjs/sinon/issues/2590
		it.skipIf(process.version.startsWith("v21"))(
			"should fetch peer dependencies from npm registry",
			async () => {
				const mockResponse = {
					json: vi.fn().mockResolvedValue({
						"dist-tags": { latest: "9.0.0" },
						versions: {
							"9.0.0": {
								peerDependencies: { eslint: "9.0.0" },
							},
						},
					}),
					ok: true,
					status: 200,
				};
				const fetchStub = vi
					.spyOn(globalThis, "fetch")
					.mockResolvedValue(mockResponse);

				const result = await fetchPeerDependencies("desired-package");

				assert.strictEqual(fetchStub.mock.calls.length, 1);
				assert.deepStrictEqual(fetchStub.mock.calls[0], [
					"https://registry.npmjs.org/desired-package",
				]);
				assert.deepStrictEqual(result, ["eslint@9.0.0"]);
			},
		);

		it("should handle package with version tag", async () => {
			const mockResponse = {
				json: vi.fn().mockResolvedValue({
					"dist-tags": { latest: "9.0.0" },
					versions: {
						"9.0.0": {
							peerDependencies: { eslint: "9.0.0" },
						},
						"8.0.0": {
							peerDependencies: { eslint: "8.0.0" },
						},
						"7.0.0": {
							peerDependencies: { eslint: "7.0.0" },
						},
					},
				}),
				ok: true,
				status: 200,
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

			await expect(
				fetchPeerDependencies("desired-package@8"),
			).resolves.toEqual(["eslint@8.0.0"]);
		});

		it("should handle package with dist tag", async () => {
			const mockResponse = {
				json: vi.fn().mockResolvedValue({
					"dist-tags": {
						latest: "9.0.0",
						legacy: "7.0.0",
					},
					versions: {
						"9.0.0": {
							peerDependencies: { eslint: "9.0.0" },
						},
						"8.0.0": {
							peerDependencies: { eslint: "8.0.0" },
						},
						"7.0.0": {
							peerDependencies: { eslint: "7.0.0" },
						},
					},
				}),
				ok: true,
				status: 200,
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

			await expect(
				fetchPeerDependencies("desired-package@legacy"),
			).resolves.toEqual(["eslint@7.0.0"]);
		});

		it("should throw if an error is thrown", async () => {
			const mockResponse = {
				json: vi.fn().mockResolvedValue({ error: "Not found" }),
				ok: false,
				status: 404,
			};
			vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

			await expect(() =>
				fetchPeerDependencies("desired-package"),
			).rejects.toThrowError();
		});
	});
});
