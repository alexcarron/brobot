import { ApplicationCommandOptionChoiceData, AutocompleteInteraction } from "discord.js";
import { isStrings, isStringToStringRecord } from "../../utilities/types/type-guards";
import { findStringsContaining } from "../../utilities/string-manipulation-utils";
import { Parameter } from "./parameter";

export type AutocompleteChoicesResolvable =
	| string[]
	| {[name: string]: string}
	| {name: string; value: string}[]

/**
 * Checks if the autocomplete interaction is focused on the specified parameter.
 * @param autocompleteInteraction The autocomplete interaction to check.
 * @param parameter The parameter to check if the autocomplete interaction is focused on.
 * @returns True if the autocomplete interaction is focused on the specified parameter, false otherwise.
 */
export function isAutocompleteForParameter(
	autocompleteInteraction: AutocompleteInteraction,
	parameter: Parameter,
): boolean {
	const focusedParameter = autocompleteInteraction.options.getFocused(true);
	return focusedParameter.name === parameter.name;
}

/**
 * Returns the value that the user has entered for the focused parameter in an autocomplete interaction.
 * @param interaction The autocomplete interaction to get the entered value from.
 * @returns The value that the user has entered for the focused parameter.
 */
export function getEnteredValue(interaction: AutocompleteInteraction): string {
	const focusedParameter = interaction.options.getFocused(true);
	return focusedParameter.value;
}

/**
 * Returns the value that the user has entered for the specified parameter in an autocomplete interaction.
 * If the user is not currently focused on the specified parameter, an empty string is returned.
 * @param interaction The autocomplete interaction to get the entered value from.
 * @param parameterName The name of the parameter to get the entered value for.
 * @returns The value that the user has entered for the specified parameter.
 */
export function getEnteredValueOfParameter(
	interaction: AutocompleteInteraction,
	parameterName: string
): string {
	const focusedParameter = interaction.options.getFocused(true);
	if (focusedParameter.name !== parameterName) return "";
	return focusedParameter.value;
}

/**
 * Returns an object with the name of each parameter as a key and its entered value as a value.
 * If the user has not entered a value for a parameter, the value for that parameter will be an empty string.
 * @param interaction The autocomplete interaction to get the entered values from.
 * @returns An object with parameter names as keys and entered values as values.
 */
export function getEnteredValueOfParameters(
	interaction: AutocompleteInteraction
): Record<string, string> {
	const parameters = interaction.options.data;
	const enteredValues: Record<string, string> = {};
	for (const parameter of parameters) {
		const name = parameter.name;
		enteredValues[name] = parameter.value?.toString() ?? '';
	}
	return enteredValues;
}

/**
 * Converts an AutocompleteChoicesResolvable into an array of ApplicationCommandOptionChoiceData.
 * If the input is an array of strings, each string is converted into an ApplicationCommandOptionChoiceData with the name and value being the same string.
 * If the input is an object with string keys and string values, each key-value pair is converted into an ApplicationCommandOptionChoiceData with the name being the key and the value being the value.
 * If the input is neither an array of strings nor an object with string keys and string values, it is returned unchanged.
 * @param autocompleteChoicesResolvable The value to convert into an array of ApplicationCommandOptionChoiceData.
 * @returns An array of ApplicationCommandOptionChoiceData, or the input if it is not an array of strings or an object with string keys and string values.
 */
export function toAutocompleteChoices(
	autocompleteChoicesResolvable: AutocompleteChoicesResolvable
): ApplicationCommandOptionChoiceData[] {
	if (isStrings(autocompleteChoicesResolvable)) {
		const autocompleteValues = autocompleteChoicesResolvable;
		return autocompleteValues.map(value => ({
			name: value,
			value: value
		}));
	}
	else if (isStringToStringRecord(autocompleteChoicesResolvable)) {
		const autocompleteNameToValue = autocompleteChoicesResolvable;
		return Object.entries(autocompleteNameToValue).map(
			([name, value]) => ({
				name: name,
				value: value
			})
		);
	}
	else {
		return autocompleteChoicesResolvable;
	}
}

/**
 * Filters an array of autocomplete choices by the entered value.
 * @param autocompleteChoices The array of autocomplete choices to filter.
 * @param enteredValue The value that the user has entered.
 * @returns An array of autocomplete choices that contain the entered value.
 */
export function filterAutocompleteByEnteredValue(
	autocompleteChoices: ApplicationCommandOptionChoiceData[],
	enteredValue: string
): ApplicationCommandOptionChoiceData[] {
	const autocompleteNames = autocompleteChoices.map(choice => choice.name);
	const filteredAutocompleteNames = findStringsContaining(enteredValue, autocompleteNames);
	return autocompleteChoices.filter(choice => filteredAutocompleteNames.includes(choice.name));
}

/**
 * Limits the number of autocomplete choices to a specified limit.
 * If the limit is not specified, it defaults to 25.
 * @param autocompleteChoices The array of autocomplete choices to limit.
 * @param limit The maximum number of autocomplete choices to return.
 * @returns An array of autocomplete choices, limited to the specified number.
 */
export function limitAutocompleteChoices(
	autocompleteChoices: ApplicationCommandOptionChoiceData[],
	limit: number = 25
): ApplicationCommandOptionChoiceData[] {
	return autocompleteChoices.slice(0, limit);
}