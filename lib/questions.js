/**
 * @fileoverview all the questions for the quiz
 * @author 唯然<weiran.zsd@outlook.com>
 */

export const langQuestions = [{
    type: "multiselect",
    name: "languages",
    message: "What do you want to lint?",
    choices: [
        { message: "JavaScript", name: "javascript" },
        { message: "JSON", name: "json" },
        { message: "JSON with comments", name: "jsonc" },
        { message: "JSON5", name: "json5" },
        { message: "Markdown", name: "md" },
        { message: "CSS", name: "css" }
    ],
    initial: 0
}, {
    type: "select",
    name: "purpose",
    message: "How would you like to use ESLint?",
    initial: 1,
    choices: [
        { message: "To check syntax only", name: "syntax" },
        { message: "To check syntax and find problems", name: "problems" }
    ]
}];

export const jsQuestions = [
    {
        type: "select",
        name: "moduleType",
        message: "What type of modules does your project use?",
        initial: 0,
        choices: [
            { message: "JavaScript modules (import/export)", name: "esm" },
            { message: "CommonJS (require/exports)", name: "commonjs" },
            { message: "None of these", name: "script" }
        ]
    },
    {
        type: "select",
        name: "framework",
        message: "Which framework does your project use?",
        initial: 0,
        choices: [
            { message: "React", name: "react" },
            { message: "Vue.js", name: "vue" },
            { message: "None of these", name: "none" }
        ]
    },
    {
        type: "toggle",
        name: "useTs",
        message: "Does your project use TypeScript?",
        disabled: "No",
        enabled: "Yes",
        initial: 0
    },
    {
        type: "multiselect",
        name: "env",
        message: "Where does your code run?",
        hint: "(Press <space> to select, <a> to toggle all, <i> to invert selection)",
        initial: 0,
        choices: [
            { message: "Browser", name: "browser" },
            { message: "Node", name: "node" }
        ]
    },
    {
        type: "select",
        name: "configFileLanguage",
        message: "Which language do you want your configuration file be written in?",
        initial: 0,
        choices: [
            { message: "JavaScript", name: "js" },
            { message: "TypeScript", name: "ts" }
        ],
        skip() {
            return !this.state.answers.useTs;
        }
    }
];

export const mdQuestions = [{
    type: "select",
    name: "mdType",
    message: "What flavor of Markdown do you want to lint?",
    initial: 0,
    choices: [
        { message: "CommonMark", name: "commonmark" },
        { message: "GitHub Flavored Markdown", name: "gfm" }
    ]
}];

export const installationQuestions = [
    {
        type: "toggle",
        name: "executeInstallation",
        message: "Would you like to install them now?",
        enabled: "Yes",
        disabled: "No",
        initial: 1
    }, {
        type: "select",
        name: "packageManager",
        message: "Which package manager do you want to use?",
        initial: 0,
        choices: ["npm", "yarn", "pnpm", "bun"],
        skip() {
            return this.state.answers.executeInstallation === false;
        }
    }
];

export const addJitiQuestion = {
    type: "toggle",
    name: "addJiti",
    message: "Would you like to add Jiti as a devDependency?",
    disabled: "No",
    enabled: "Yes",
    initial: 1
};
