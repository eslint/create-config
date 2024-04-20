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

    afterEach(() => {
        sinon.verifyAndRestore();
    });

    it("find pnpm-workspace.yaml", () => {
        const pnpmWorkspaceYaml = findPnpmWorkspaceYaml(pnpmWithWorkspaceDir);

        expect(pnpmWorkspaceYaml).toBeTruthy();
    });

    it("should invoke pnpm with workspace option to install a single desired packages", async () => {
        const stub = sinon.stub(spawn, "sync").returns({ stdout: 0 });

        installSyncSaveDev("desired-package", pnpmWithWorkspaceDir, "pnpm");
        assert(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], "pnpm");
        assert.deepStrictEqual(stub.firstCall.args[1], ["add", "-D", "-w", "desired-package"]);
        stub.restore();
    });
});
