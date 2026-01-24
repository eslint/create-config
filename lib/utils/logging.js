/**
 * @fileoverview Handle logging for ESLint
 * @author Gyandeep Singh
 */

// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import colors from "ansi-colors";

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Used for joining and add bold style to an array of arguments.
 * @param {any[]} args Array of arguments.
 * @returns {string} Joined and bolded string.
 */
function boldArgs(args) {
	return colors.bold(args.join(" "));
}

// ------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------

/* eslint no-console: "off" -- Logging util */

/**
 * Cover for console.log
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function log(...args) {
	console.log(boldArgs(args));
}

/**
 * Cover for console.log with check symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function success(...args) {
	console.log(colors.green(colors.symbols.check), boldArgs(args));
}

/**
 * Cover for console.info with info symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function info(...args) {
	console.info(colors.blue(colors.symbols.info), boldArgs(args));
}

/**
 * Cover for console.warn with warn symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
	console.warn(colors.yellow(colors.symbols.warning), boldArgs(args));
}

/**
 * Cover for console.error with cross symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
	console.error(colors.magenta(colors.symbols.cross), boldArgs(args));
}
