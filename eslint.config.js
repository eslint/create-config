import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigESLint from "eslint-config-eslint";

export default defineConfig([
	globalIgnores(["coverage/", "tests/fixtures/"]),
	eslintConfigESLint,
]);
