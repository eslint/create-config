/**
 * @fileoverview Tests for prompt utilities.
 * @author Pixel998
 */

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from "vitest";
import { PromptCancelError, promptQuestions } from "../lib/prompt.js";

//-------------------------------------------------------------------------------
// Helpers
//-------------------------------------------------------------------------------

const clack = vi.hoisted(() => ({
	cancel: vi.fn(),
	confirm: vi.fn(),
	group: vi.fn(),
	multiselect: vi.fn(),
	select: vi.fn(),
}));

vi.mock("@clack/prompts", () => clack);

/**
 * Answers each prompt in order, like Clack's group utility.
 * @param {Object<string, Function>} prompts The grouped prompts.
 * @returns {Promise<Object>} The answers to the prompts.
 */
async function answerPrompts(prompts) {
	const answers = {};

	for (const [name, prompt] of Object.entries(prompts)) {
		answers[name] = await prompt({ results: answers });
	}

	return answers;
}

//-------------------------------------------------------------------------------
// Tests
//-------------------------------------------------------------------------------

describe("promptQuestions()", () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	it("uses the appropriate Clack prompts and preserves initial values", async () => {
		clack.group.mockImplementation(answerPrompts);
		clack.multiselect.mockResolvedValue(["javascript"]);
		clack.select.mockResolvedValue("problems");

		const answers = await promptQuestions([
			{
				type: "multiselect",
				name: "languages",
				message: "What do you want to lint?",
				initialValues: ["javascript"],
				options: [{ label: "JavaScript", value: "javascript" }],
			},
			{
				type: "select",
				name: "purpose",
				message: "How would you like to use ESLint?",
				initialValue: "problems",
				options: [{ label: "Find problems", value: "problems" }],
			},
		]);

		expect(answers).toEqual({
			languages: ["javascript"],
			purpose: "problems",
		});
		expect(clack.multiselect).toHaveBeenCalledWith(
			expect.objectContaining({
				initialValues: ["javascript"],
			}),
		);
		expect(clack.select).toHaveBeenCalledWith(
			expect.objectContaining({ initialValue: "problems" }),
		);
	});

	it("omits skipped questions from the returned answers", async () => {
		clack.group.mockImplementation(answerPrompts);
		clack.confirm.mockResolvedValue(false);

		const answers = await promptQuestions([
			{
				type: "confirm",
				name: "useTs",
				message: "Does your project use TypeScript?",
			},
			{
				type: "select",
				name: "configFileLanguage",
				message: "Which language should the config use?",
				options: [{ label: "TypeScript", value: "ts" }],
				skip({ answers: previousAnswers }) {
					return !previousAnswers.useTs;
				},
			},
		]);

		expect(answers).toEqual({ useTs: false });
		expect(clack.select).not.toHaveBeenCalled();
	});

	it("ends the prompt flow gracefully when a prompt is canceled", async () => {
		clack.group.mockImplementation(async (_prompts, { onCancel }) =>
			onCancel(),
		);

		await expect(promptQuestions([])).rejects.toBeInstanceOf(
			PromptCancelError,
		);
		expect(clack.cancel).toHaveBeenCalledWith("Operation canceled.");
	});
});
