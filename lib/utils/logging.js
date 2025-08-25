/**
 * @fileoverview Handle logging for ESLint
 * @author Gyandeep Singh
 */

import color from "ansi-colors";

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
 * Cover for console.info with info symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function info(...args) {
    console.info(color.blue(color.symbols.info), ...args);
}

/**
 * Cover for console.log with check symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function success(...args) {
    console.log(color.green(color.symbols.check), ...args);
}

/**
 * Cover for console.warn with warning symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
    console.warn(color.yellow(color.symbols.warning), ...args);
}

/**
 * Cover for console.error with cross symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
    console.error(color.red(color.symbols.cross), ...args);
}
