/**
 * @fileoverview all the questions for the quiz
 * @author 唯然<weiran.zsd@outlook.com>
 */

/**
 * @typedef {Record<string, any>} PlainObject
 */

// ------------------------------------------------------------------------------
// Imports
// ------------------------------------------------------------------------------

import * as p from "@clack/prompts";

// ------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------

export const langQuestions = {
    languages: () => p.multiselect({
        message: "What do you want to lint?",
        options: [
            { label: "JavaScript", value: "javascript" },
            { label: "JSON", value: "json" },
            { label: "JSON with comments", value: "jsonc" },
            { label: "JSON5", value: "json5" },
            { label: "Markdown", value: "md" },
            { label: "CSS", value: "css" }
        ],
        initialValues: ["javascript"]
    }),
    purpose: () => p.select({
        message: "How would you like to use ESLint?",
        initialValue: "problems",
        options: [
            { label: "To check syntax only", value: "syntax" },
            { label: "To check syntax and find problems", value: "problems" }
        ]
    })
};

export const jsQuestions = {
    moduleType: () => p.select({
        message: "What type of modules does your project use?",
        initialValue: "esm",
        options: [
            { label: "JavaScript modules (import/export)", value: "esm" },
            { label: "CommonJS (require/exports)", value: "commonjs" },
            { label: "None of these", value: "script" }
        ]
    }),
    framework: () => p.select({
        message: "Which framework does your project use?",
        initialValue: "react",
        options: [
            { label: "React", value: "react" },
            { label: "Vue.js", value: "vue" },
            { label: "None of these", value: "none" }
        ]
    }),
    useTs: () => p.confirm({
        message: "Does your project use TypeScript?",
        initialValue: false
    }),
    env: () => p.multiselect({
        message: "Where does your code run?",
        initialValues: ["browser"],
        options: [
            { label: "Browser", value: "browser" },
            { label: "Node", value: "node" }
        ]
    }),
    async configFileLanguage({ results }) {
        if (results.useTs) {
            return await p.select({
                message: "Which language do you want your configuration file be written in?",
                initialValue: "js",
                options: [
                    { label: "JavaScript", value: "js" },
                    { label: "TypeScript", value: "ts" }
                ]
            });
        }

        return "js";
    }
};

export const mdQuestions = {
    mdType: () => p.select({
        message: "What flavor of Markdown do you want to lint?",
        initialValue: "commonmark",
        options: [
            { label: "CommonMark", value: "commonmark" },
            { label: "GitHub Flavored Markdown", value: "gfm" }
        ]
    })
};

export const installationQuestions = {
    executeInstallation: () => p.confirm({
        message: "Would you like to install them now?",
        initialValue: true
    }),
    async packageManager({ results }) {
        if (results.executeInstallation) {
            return await p.select({
                message: "Which package manager do you want to use?",
                initialValue: "npm",
                options: [
                    { value: "npm" },
                    { value: "yarn" },
                    { value: "pnpm" },
                    { value: "bun" }
                ]
            });
        }

        return "npm";
    }
};

export const addJitiQuestion = {
    addJiti: () => p.confirm({
        message: "Would you like to add Jiti as a devDependency?",
        initialValue: true
    })
};
