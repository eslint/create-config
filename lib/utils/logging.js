/**
 * @fileoverview Handle logging for ESLint
 * @author Gyandeep Singh
 */

// Import colors
import colors from 'ansi-colors';

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
 * Cover for console.warn with warning symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function warn(...args) {
    console.warn(`${colors.yellow(colors.symbols.warning)} ${args.join(' ')}`);
}

/**
 * Cover for console.error with error symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function error(...args) {
    console.error(`${colors.red(colors.symbols.cross)} ${args.join(' ')}`);
}

/**
 * Cover for console.log with success symbol
 * @param {...any} args The elements to log.
 * @returns {void}
 */
export function success(...args) {
    console.log(`${colors.green(colors.symbols.check)} ${args.join(' ')}`);
}