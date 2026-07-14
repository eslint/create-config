/**
 * @fileoverview Prompt utilities.
 * @author Pixel998
 */

//------------------------------------------------------------------------------
// Imports
//------------------------------------------------------------------------------

import { cancel, confirm, group, multiselect, select } from "@clack/prompts";

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
 * @param {Object} question The question.
 * @param {Object} answers Answers already collected.
 * @returns {boolean} Whether to skip the question.
 */
function shouldSkip(question, answers) {
	return typeof question.skip === "function" && question.skip({ answers });
}

/**
 * Prompts the user with one question.
 * @param {Object} question The question.
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
 * @param {Object} question The question.
 * @param {Object} initialAnswers Answers already collected.
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
 * @param {Object} answers The prompt answers.
 * @returns {Object} The answers without skipped questions.
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
 * @param {Object[]} questions The questions.
 * @param {Object} [initialAnswers] Answers already collected.
 * @returns {Promise<Object>} The collected answers.
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
