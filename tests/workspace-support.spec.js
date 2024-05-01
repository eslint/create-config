/**
 * @fileoverview tests for pnpm workspace install packages at root
 * @author Wataru Nishimura<wataru.chame.gon@gmail.com>
 */

import { describe, it, expect, assert, afterEach } from "vitest";
import { fileURLToPath } from "node:url";
import { join } from "path";
import { findPnpmWorkspaceYaml, installSyncSaveDev } from "../lib/utils/npm-utils.js";
import sinon from "sinon";
import spawn from "cross-spawn";

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle -- commonjs convention

describe("pnpm workspace install packages at root", () => {
    const pnpmWithWorkspaceDir = join(__filename, "../fixtures/pnpm-workspace-project");
    const yarnLegacyWithWorkspaceDir = join(__filename, "../fixtures/yarn-legacy-workspace-project");

    afterEach(() => {
        sinon.verifyAndRestore();
    });

    /**
     * pnpm recognizes whether workspace is enabled by `pnpm-workspace.yaml`.
     * This test case tests function to find `pnpm-workspace.yaml`.
     */
    it("find pnpm-workspace.yaml", () => {
        const pnpmWorkspaceYaml = findPnpmWorkspaceYaml(pnpmWithWorkspaceDir);

        expect(pnpmWorkspaceYaml).toBeTruthy();
    });

    /**
     * at project root, `pnpm add` needs to be applied "-w" option.
     */
    it("should invoke pnpm with workspace option to install a single desired packages", async () => {
        const stub = sinon.stub(spawn, "sync").returns({ stdout: 0 });

        installSyncSaveDev("desired-package", pnpmWithWorkspaceDir, "pnpm");
        assert(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], "pnpm");
        assert.deepStrictEqual(stub.firstCall.args[1], ["add", "-D", "-w", "desired-package"]);
        stub.restore();
    });

    it("should invoke yarn legacy with workspace option to install a single desired packages", async () => {
        const stub = sinon.stub(spawn, "sync").returns({ stdout: 0 });

        installSyncSaveDev("desired-package", yarnLegacyWithWorkspaceDir, "yarn");
        assert(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], "yarn");
        assert.deepStrictEqual(stub.firstCall.args[1], ["add", "-D", "-W", "desired-package"]);
    });

});
