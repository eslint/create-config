/**
 * @fileoverview Helper to locate and load configuration files.
 * @author Nicholas C. Zakas
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import fs from "fs";
import path from "path";
import stringify from "json-stable-stringify-without-jsonify";
import debugEsm from "debug";
import spawn from "cross-spawn";
import * as log from "../shared/logging.js";

const debug = debugEsm("eslint:config-file");
const cwd = process.cwd();

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Determines sort order for object keys for json-stable-stringify
 *
 * see: https://github.com/samn/json-stable-stringify#cmp
 * @param {Object} a The first comparison object ({key: akey, value: avalue})
 * @param {Object} b The second comparison object ({key: bkey, value: bvalue})
 * @returns {number} 1 or -1, used in stringify cmp method
 */
function sortByKey(a, b) {
    return a.key > b.key ? 1 : -1;
}

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

/**
 * Writes a configuration file in JSON format.
 * @param {Object} config The configuration object to write.
 * @param {string} filePath The filename to write to.
 * @returns {void}
 * @private
 */
function writeJSONConfigFile(config, filePath) {
    debug(`Writing JSON config file: ${filePath}`);

    const content = `${stringify(config, { cmp: sortByKey, space: 4 })}\n`;

    fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Writes a configuration file in YAML format.
 * @param {Object} config The configuration object to write.
 * @param {string} filePath The filename to write to.
 * @returns {void}
 * @private
 */
async function writeYAMLConfigFile(config, filePath) {
    debug(`Writing YAML config file: ${filePath}`);

    // lazy load YAML to improve performance when not used
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const yaml = await import("js-yaml");

    const content = yaml.dump(config, { sortKeys: true });

    fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Writes a configuration file in JavaScript format.
 * @param {Object} config The configuration object to write.
 * @param {string} filePath The filename to write to.
 * @throws {Error} If an error occurs linting the config file contents.
 * @returns {void}
 * @private
 */
async function writeJSConfigFile(config, filePath) {
    debug(`Writing JS config file: ${filePath}`);

    const stringifiedContent = `module.exports = ${stringify(config, { cmp: sortByKey, space: 4 })}\n`;

    fs.writeFileSync(filePath, stringifiedContent, "utf8");

    // import("eslint") won't work in some cases.
    // refs: https://github.com/eslint/create-config/issues/8, https://github.com/eslint/create-config/issues/12
    const eslintBin = path.join(cwd, "./node_modules/.bin/eslint");
    const result = spawn.sync(eslintBin, ["--fix", "--quiet", filePath], { encoding: "utf8" });

    if (result.error || result.status !== 0) {
        log.error("A config file was generated, but the config file itself may not follow your linting rules.");
    }
}

/**
 * Writes a configuration file.
 * @param {Object} config The configuration object to write.
 * @param {string} filePath The filename to write to.
 * @returns {void}
 * @throws {Error} When an unknown file type is specified.
 * @private
 */
async function write(config, filePath) {
    switch (path.extname(filePath)) {
        case ".js":
        case ".cjs":
            await writeJSConfigFile(config, filePath);
            break;

        case ".json":
            writeJSONConfigFile(config, filePath);
            break;

        case ".yaml":
        case ".yml":
            await writeYAMLConfigFile(config, filePath);
            break;

        default:
            throw new Error("Can't write to unknown file type.");
    }
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export {
    write
};
