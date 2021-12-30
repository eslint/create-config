"use strict";

module.exports = {
    root: true,
    extends: [
        "eslint"
    ],
    parserOptions: {
        ecmaVersion: "latest"
    },
    overrides: [
        {
            files: [
                "tests/**/*.js"
            ],
            env: {
                mocha: true
            }
        }
    ],
    ignorePatterns: [
        "fixtures/"
    ]
};
