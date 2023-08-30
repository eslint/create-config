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
        settings: {
            jsdoc: {
                preferredTypes: {
                    Object: "object",
                    "object<>": "Object"
                }
            }
        }
    },
    {
        files: ["tests/**"],
        languageOptions: {
            globals: {
                ...globals.mocha
            }
        }
    }
];
