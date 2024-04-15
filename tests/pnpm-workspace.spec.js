/**
 * @fileoverview tests for pnpm workspace install packages at root
 * @author Wataru Nishimura<wataru.chame.gon@gmail.com>
 */

import { describe, test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { join } from "path";
import { findPnpmWorkspaceYaml } from "../lib/utils/npm-utils.js";

const __filename = fileURLToPath(import.meta.url); // eslint-disable-line no-underscore-dangle -- commonjs convention

describe("pnpm workspace install packages at root", () => {
    const pnpmWithWorkspaceDir = join(__filename, "../fixtures/pnpm-workspace-project");

    test("find pnpm-workspace.yaml", () => {
        const pnpmWorkspaceYaml = findPnpmWorkspaceYaml(pnpmWithWorkspaceDir);

        expect(pnpmWorkspaceYaml).toBeTruthy();
    });
});
