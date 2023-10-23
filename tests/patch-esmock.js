/**
 * @fileoverview Run by npm to replace esmock with a legacy release on older versions of Node.js.
 * @author Francesco Trotta
 */

import { promises as fs } from "fs";

// esmock < 2.4 supports only Node.js < 19. esmock >= 2.4 supports only Node.js >= 18.6.
// If we are running Node.js < 19, replace the esmock dependency with the legacy release.
if (process.versions.modules < 111) {
    (async () => {
        await fs.rmdir("node_modules/esmock", { recursive: true });
        await fs.rename("node_modules/esmock_legacy", "node_modules/esmock");
    })();
}
