/**
 * @fileoverview Prompt utilities.
 * @author Pixel998
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import { cancel, confirm, group, multiselect, select } from "@clack/prompts";

//------------------------------------------------------------------------------
// Type Definitions
//------------------------------------------------------------------------------

/**
 * @import { ConfirmOptions, MultiSelectOptions, SelectOptions } from "@clack/prompts";
 * @typedef {Record<string, unknown>} Answers
 * @typedef {{
 *   name: string,
 *   skip?: (context: { answers: Answers }) => boolean,
 * } & (
 *   ({ type: "select" } & SelectOptions<string>) |
 *   ({ type: "multiselect" } & MultiSelectOptions<string>) |
 *   ({ type: "confirm" } & ConfirmOptions)
 * )} Question
 */

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const cancellationMessage = "Operation canceled.";

/**
 * Error thrown when the user cancels a prompt.
 */
export class PromptCancelError extends Error {
	/**
	 * Creates a prompt cancel error.
	 */
	constructor() {
		super(cancellationMessage);
		this.name = "PromptCancelError";
	}
}

/**
 * Handles a prompt cancellation.
 * @throws {PromptCancelError} When the prompt is canceled.
 * @returns {never} Always throws a prompt cancellation error.
 */
function handleCancel() {
	cancel(cancellationMessage);
	throw new PromptCancelError();
}

/**
 * Checks if the question should be skipped.
 * @param {Question} question The question.
 * @param {Answers} answers Answers already collected.
 * @returns {boolean} Whether to skip the question.
 */
function shouldSkip(question, answers) {
	return typeof question.skip === "function" && question.skip({ answers });
}

/**
 * Prompts the user with one question.
 * @param {Question} question The question.
 * @returns {Promise<any>} The prompt answer.
 */
async function promptQuestion(question) {
	if (question.type === "select") {
		return select({
			message: question.message,
			options: question.options,
			initialValue: question.initialValue,
		});
	}

	if (question.type === "multiselect") {
		return multiselect({
			message: question.message,
			options: question.options,
			initialValues: question.initialValues,
			required: question.required,
			cursorAt: question.cursorAt,
		});
	}

	if (question.type === "confirm") {
		return confirm({
			message: question.message,
			active: question.active,
			inactive: question.inactive,
			initialValue: question.initialValue,
		});
	}

	throw new Error(`Unsupported prompt type: ${question.type}`);
}

/**
 * Creates a prompt group entry.
 * @param {Question} question The question.
 * @param {Answers} initialAnswers Answers already collected.
 * @returns {Function} The prompt group entry.
 */
function createPrompt(question, initialAnswers) {
	return async ({ results }) => {
		const answers = { ...initialAnswers, ...results };

		if (shouldSkip(question, answers)) {
			return void 0;
		}

		return promptQuestion(question);
	};
}

/**
 * Removes skipped question results.
 * @param {Answers} answers The prompt answers.
 * @returns {Answers} The answers without skipped questions.
 */
function removeSkippedAnswers(answers) {
	return Object.fromEntries(
		Object.entries(answers).filter(([, value]) => value !== void 0),
	);
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * Prompts the user with a sequence of questions.
 * @param {Question[]} questions The questions.
 * @param {Answers} [initialAnswers] Answers already collected.
 * @returns {Promise<Answers>} The collected answers.
 */
export async function promptQuestions(questions, initialAnswers = {}) {
	const prompts = Object.fromEntries(
		questions.map(question => [
			question.name,
			createPrompt(question, initialAnswers),
		]),
	);
	const answers = await group(prompts, {
		onCancel() {
			handleCancel();
		},
	});

	return removeSkippedAnswers(answers);
}
