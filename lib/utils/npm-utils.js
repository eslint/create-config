/**
 * @fileoverview Utility for executing npm commands.
 * @author Ian VanSchooten
 */


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import fs from "node:fs";
import spawn from "cross-spawn";
import path from "node:path";
import * as log from "./logging.js";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Find the closest package.json file, starting at process.cwd (by default),
 * and working up to root.
 * @param {string} [startDir=process.cwd()] Starting directory
 * @returns {string} Absolute path to closest package.json file
 */
function findPackageJson(startDir) {
    let dir = path.resolve(startDir || process.cwd());

    do {
        const pkgFile = path.join(dir, "package.json");

        if (!fs.existsSync(pkgFile) || !fs.statSync(pkgFile).isFile()) {
            dir = path.join(dir, "..");
            continue;
        }
        return pkgFile;
    } while (dir !== path.resolve(dir, ".."));
    return null;
}

//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

/**
 * Install node modules synchronously and save to devDependencies in package.json
 * @param {string|string[]} packages Node module or modules to install
 * @param {string} packageManager Package manager to use for installation.
 * @param {string[]} installFlags Flags to pass to the package manager.
 * @returns {void}
 */
function installSyncSaveDev(packages, packageManager = "npm", installFlags = ["-D"]) {
    const packageList = Array.isArray(packages) ? packages : [packages];
    const installCmd = packageManager === "yarn" ? "add" : "install";
    const installProcess = spawn.sync(packageManager, [installCmd, ...installFlags].concat(packageList), { stdio: "inherit" });
    const error = installProcess.error;

    if (error && error.code === "ENOENT") {
        const pluralS = packageList.length > 1 ? "s" : "";

        log.error(`Could not execute ${packageManager}. Please install the following package${pluralS} with a package manager of your choice: ${packageList.join(", ")}`);
    }
}

/**
 * Parses a package name string into its name and version components.
 * @param {string} packageName The package name to parse.
 * @returns {Object} An object with 'name' and 'version' properties.
 */
function parsePackageName(packageName) {
    const atIndex = packageName.lastIndexOf("@");

    if (atIndex > 0) {
        const name = packageName.slice(0, atIndex);
        const version = packageName.slice(atIndex + 1) || "latest";

        return { name, version };
    }
    return { name: packageName, version: "latest" };

}

/**
 * Fetch `peerDependencies` of the given package by `npm show` command.
 * @param {string} packageName The package name to fetch peerDependencies.
 * @returns {Object} Gotten peerDependencies. Returns null if npm was not found.
 */
async function fetchPeerDependencies(packageName) {
    const npmProcess = spawn.sync(
        "npm",
        ["show", "--json", packageName, "peerDependencies"],
        { encoding: "utf8" }
    );

    const error = npmProcess.error;

    if (error && error.code === "ENOENT") {

        // Fallback to using the npm registry API directly when npm is not available.
        const { name, version } = parsePackageName(packageName);

        try {
            // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Fallback using built-in fetch
            const response = await fetch(`https://registry.npmjs.org/${name}`);
            const data = await response.json();

            const resolvedVersion =
        version === "latest" ? data["dist-tags"]?.latest : version;
            const packageVersion = data.versions[resolvedVersion];

            if (!packageVersion) {
                throw new Error(
                    `Version "${version}" not found for package "${name}".`
                );
            }
            return Object.entries(packageVersion.peerDependencies).map(
                ([pkgName, pkgVersion]) => `${pkgName}@${pkgVersion}`
            );
        } catch {

            // TODO: should throw an error instead of returning null
            return null;
        }
    }
    const fetchedText = npmProcess.stdout.trim();

    const peers = JSON.parse(fetchedText || "{}");
    const dependencies = [];

    Object.keys(peers).forEach(pkgName => {
        dependencies.push(`${pkgName}@${peers[pkgName]}`);
    });

    return dependencies;
}

/**
 * Check whether node modules are include in a project's package.json.
 * @param {string[]} packages Array of node module names
 * @param {Object} opt Options Object
 * @param {boolean} opt.dependencies Set to true to check for direct dependencies
 * @param {boolean} opt.devDependencies Set to true to check for development dependencies
 * @param {boolean} opt.startdir Directory to begin searching from
 * @throws {Error} If cannot find valid `package.json` file.
 * @returns {Object} An object whose keys are the module names
 *                                        and values are booleans indicating installation.
 */
function check(packages, opt) {
    const deps = new Set();
    const pkgJson = (opt) ? findPackageJson(opt.startDir) : findPackageJson();

    if (!pkgJson) {
        throw new Error("Could not find a package.json file. Run 'npm init' to create one.");
    }

    const fileJson = JSON.parse(fs.readFileSync(pkgJson, "utf8"));

    ["dependencies", "devDependencies"].forEach(key => {
        if (opt[key] && typeof fileJson[key] === "object") {
            Object.keys(fileJson[key]).forEach(dep => deps.add(dep));
        }
    });

    return packages.reduce((status, pkg) => {
        status[pkg] = deps.has(pkg);
        return status;
    }, {});
}

/**
 * Check whether node modules are included in the dependencies of a project's
 * package.json.
 *
 * Convenience wrapper around check().
 * @param {string[]} packages Array of node modules to check.
 * @param {string} rootDir The directory containing a package.json
 * @returns {Object} An object whose keys are the module names
 *                               and values are booleans indicating installation.
 */
function checkDeps(packages, rootDir) {
    return check(packages, { dependencies: true, startDir: rootDir });
}

/**
 * Check whether node modules are included in the devDependencies of a project's
 * package.json.
 *
 * Convenience wrapper around check().
 * @param {string[]} packages Array of node modules to check.
 * @returns {Object} An object whose keys are the module names
 *                               and values are booleans indicating installation.
 */
function checkDevDeps(packages) {
    return check(packages, { devDependencies: true });
}

/**
 * Check whether package.json is found in current path.
 * @param {string} [startDir] Starting directory
 * @returns {boolean} Whether a package.json is found in current path.
 */
function checkPackageJson(startDir) {
    return !!findPackageJson(startDir);
}

/**
 * check if the package.type === "module"
 * @param {string} pkgJSONPath path to package.json
 * @returns {boolean} return true if the package.type === "module"
 */
function isPackageTypeModule(pkgJSONPath) {

    if (pkgJSONPath) {
        const pkgJSONContents = JSON.parse(fs.readFileSync(pkgJSONPath, "utf8"));

        if (pkgJSONContents.type === "module") {
            return true;
        }
    }

    return false;
}


//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

export {
    installSyncSaveDev,
    parsePackageName,
    fetchPeerDependencies,
    findPackageJson,
    checkDeps,
    checkDevDeps,
    checkPackageJson,
    isPackageTypeModule
};
