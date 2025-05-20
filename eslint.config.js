import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";

export default defineConfig([
    globalIgnores(["coverage/", "tests/fixtures/"]),
    eslintConfigESLint,
    eslintConfigESLintFormatting
]);
