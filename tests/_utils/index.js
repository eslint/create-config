/**
 * @fileoverview Utilities used in tests
 */


//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

import { defineInMemoryFs } from "./in-memory-fs.js";
import fsTeardown from "fs-teardown";

const { createTeardown, addFile } = fsTeardown;

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Creates a new filesystem volume at the given location with the given files.
 * @param {Object} desc A description of the filesystem volume to create.
 * @param {string} desc.cwd The current working directory ESLint is using.
 * @param {Object} desc.files A map of filename to file contents to create.
 * @returns {Teardown} An object with prepare(), cleanup(), and getPath()
 *      methods.
 */
function createCustomTeardown({ cwd, files }) {
    const { prepare, cleanup, getPath } = createTeardown(
        cwd,
        ...Object.keys(files).map(filename => addFile(filename, files[filename]))
    );

    return { prepare, cleanup, getPath };
}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

export {
    defineInMemoryFs,
    createCustomTeardown
};
