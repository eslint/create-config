/**
 * @fileoverview all the questions for the quiz
 * @author 唯然<weiran.zsd@outlook.com>
 */

// ------------------------------------------------------------------------------
// Exports
// ------------------------------------------------------------------------------

export const langQuestions = [
	{
		type: "multiselect",
		name: "languages",
		message: "What do you want to lint?",
		options: [
			{ label: "JavaScript", value: "javascript" },
			{ label: "JSON", value: "json" },
			{ label: "JSON with comments", value: "jsonc" },
			{ label: "JSON5", value: "json5" },
			{ label: "Markdown", value: "md" },
			{ label: "CSS", value: "css" },
		],
		initialValues: ["javascript"],
	},
	{
		type: "select",
		name: "purpose",
		message: "How would you like to use ESLint?",
		initialValue: "problems",
		options: [
			{ label: "To check syntax only", value: "syntax" },
			{
				label: "To check syntax and find problems",
				value: "problems",
			},
		],
	},
];

export const jsQuestions = [
	{
		type: "select",
		name: "moduleType",
		message: "What type of modules does your project use?",
		initialValue: "esm",
		options: [
			{ label: "JavaScript modules (import/export)", value: "esm" },
			{ label: "CommonJS (require/exports)", value: "commonjs" },
			{ label: "None of these", value: "script" },
		],
	},
	{
		type: "select",
		name: "framework",
		message: "Which framework does your project use?",
		initialValue: "react",
		options: [
			{ label: "React", value: "react" },
			{ label: "Vue.js", value: "vue" },
			{ label: "None of these", value: "none" },
		],
	},
	{
		type: "confirm",
		name: "useTs",
		message: "Does your project use TypeScript?",
		active: "Yes",
		inactive: "No",
		initialValue: false,
	},
	{
		type: "multiselect",
		name: "env",
		message: "Where does your code run?",
		initialValues: ["browser"],
		required: false,
		options: [
			{ label: "Browser", value: "browser" },
			{ label: "Node", value: "node" },
		],
	},
	{
		type: "select",
		name: "configFileLanguage",
		message:
			"Which language do you want your configuration file be written in?",
		initialValue: "js",
		options: [
			{ label: "JavaScript", value: "js" },
			{ label: "TypeScript", value: "ts" },
		],
		skip({ answers }) {
			return !answers.useTs;
		},
	},
];

export const mdQuestions = [
	{
		type: "select",
		name: "mdType",
		message: "What flavor of Markdown do you want to lint?",
		initialValue: "commonmark",
		options: [
			{ label: "CommonMark", value: "commonmark" },
			{ label: "GitHub Flavored Markdown", value: "gfm" },
		],
	},
];

export const installationQuestions = [
	{
		type: "confirm",
		name: "executeInstallation",
		message: "Would you like to install them now?",
		active: "Yes",
		inactive: "No",
		initialValue: true,
	},
	{
		type: "select",
		name: "packageManager",
		message: "Which package manager do you want to use?",
		initialValue: "npm",
		options: [
			{ label: "npm", value: "npm" },
			{ label: "yarn", value: "yarn" },
			{ label: "pnpm", value: "pnpm" },
			{ label: "bun", value: "bun" },
		],
		skip({ answers }) {
			return answers.executeInstallation === false;
		},
	},
];

export const addJitiQuestion = [
	{
		type: "confirm",
		name: "addJiti",
		message: "Would you like to add Jiti as a devDependency?",
		active: "Yes",
		inactive: "No",
		initialValue: true,
	},
];
