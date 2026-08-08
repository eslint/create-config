/**
 * @fileoverview Tests for `package.json` exports.
 * @author lumir(lumirlumir)
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { createRequire } from "node:module";
import { assert, describe, it } from "vitest";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const require = createRequire(import.meta.url);

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("package exports", () => {
	it("should prevent imports of internal modules", () => {
		let error;

		try {
			/*
			 * Vitest handles `await import()` with Vite's resolver, which doesn't
			 * preserve Node.js's `ERR_PACKAGE_PATH_NOT_EXPORTED` error code,
			 * so we use `createRequire` instead.
			 */
			require.resolve("@eslint/create-config/lib/utils/logging.js");
		} catch (caughtError) {
			error = caughtError;
		}

		assert.strictEqual(error?.code, "ERR_PACKAGE_PATH_NOT_EXPORTED");
	});
});
