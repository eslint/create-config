import eslintConfigESLint from "eslint-config-eslint";
import eslintConfigESLintFormatting from "eslint-config-eslint/formatting";

export default [
    {
        ignores: [
            "coverage/",
            "tests/fixtures/"
        ]
    },
    ...eslintConfigESLint,
    eslintConfigESLintFormatting
];
