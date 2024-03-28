import eslintConfigESLint from "eslint-config-eslint";

export default [
    {
        ignores: [
            "coverage/",
            "tests/fixtures/"
        ]
    },
    ...eslintConfigESLint
];
