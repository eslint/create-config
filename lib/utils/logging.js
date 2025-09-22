/**
 * @fileoverview Handle logging for ESLint
 * @author Gyandeep Singh
 */

import colors from "ansi-colors";

/* eslint no-console: "off" -- Logging util */

/**
 * Cover for console.log
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function log(...args) {
    console.log(...args);
}

/**
 * Cover for console.log with check symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function success(...args) {
    console.log(colors.green(colors.symbols.check), ...args);
}

/**
 * Cover for console.log with info symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function info(...args) {
    console.log(colors.blue(colors.symbols.info), ...args);
}

/**
 * Cover for console.warn with warn symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
    console.warn(colors.yellow(colors.symbols.warning), ...args);
}

/**
 * Cover for console.error with cross symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
    console.error(colors.red(colors.symbols.cross), ...args);
}
