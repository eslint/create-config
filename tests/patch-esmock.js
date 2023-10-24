/**
 * @fileoverview Run by npm to replace esmock with a legacy release on older versions of Node.js.
 * @author Francesco Trotta
 */

import { promises as fs } from "fs";

// * esmock < 2.4 works only on Node.js < 19.
// * esmock >= 2.4 works only on Node.js >= 18.6.
// If we are running Node.js < 19, replace the esmock dependency with the legacy release.
// 111 is the ABI version number of Node.js 19: https://nodejs.org/en/download/releases
if (process.versions.modules < 111) {
    (async () => {
        try {
            await fs.access("node_modules/esmock_legacy");
        } catch {
            return;
        }
        await fs.rmdir("node_modules/esmock", { recursive: true });
        await fs.rename("node_modules/esmock_legacy", "node_modules/esmock");
    })();
}
