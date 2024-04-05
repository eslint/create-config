/**
 * @fileoverview Handle logging for ESLint
 * @author Gyandeep Singh
 */


/* eslint no-console: "off" -- Logging util */

/**
 * Cover for console.log
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function info(...args) {
    console.log(...args);
}

/**
 * Cover for console.warn
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
    console.warn(...args);
}

/**
 * Cover for console.error
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
    console.error(...args);
}
