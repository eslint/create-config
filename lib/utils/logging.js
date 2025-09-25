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
    console.log(colors.bold(args.join(" ")));
}

/**
 * Cover for console.log with check symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function success(...args) {
    console.log(colors.green(colors.symbols.check), colors.bold(args.join(" ")));
}

/**
 * Cover for console.info with info symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function info(...args) {
    console.info(colors.blue(colors.symbols.info), colors.bold(args.join(" ")));
}

/**
 * Cover for console.warn with warn symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
    console.warn(colors.yellow(colors.symbols.warning), colors.bold(args.join(" ")));
}

/**
 * Cover for console.error with cross symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
    console.error(colors.magenta(colors.symbols.cross), colors.bold(args.join(" ")));
}
