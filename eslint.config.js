import eslintConfigESLint from "eslint-config-eslint";
import globals from "globals";

export default [
    {
        ignores: [
            "coverage/",
            "tests/fixtures/"
        ]
    },
    ...eslintConfigESLint,
    {
        files: ["tests/**"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
