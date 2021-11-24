"use strict";

module.exports = {
    root: true,
    extends: [
        "eslint"
    ],
    parserOptions: {
        ecmaVersion: "latest"
    },
    rules: {
        "node/no-unpublished-import": [
            "error",
            {
                allowModules: [
                    "eslint"
                ]
            }
        ]
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
