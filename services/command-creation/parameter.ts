import { ApplicationCommandOptionBase } from 'discord.js';
import { toTitleCase } from '../../utilities/string-manipulation-utils';

export const ParameterType = Object.freeze({
	SUBCOMMAND: "subcommand",
	STRING: "string",
	CHANNEL: "channel",
	ATTACHMENT: "attachment",
	BOOLEAN: "boolean",
	MENTIONABLE: "mentionable",
	NUMBER: "number",
	INTEGER: "integer",
	ROLE: "role",
	USER: "user"
})

/**
 * Represents a Discord command parameter.
 * @class
 */
export class Parameter {
	type;

	name;

	description;

	isRequired;

	isAutocomplete;

	min_value;

	max_value;

	autocomplete;

	subparameters;

	subcommands;

	/**
	 * Creates a new Parameter.
	 * @param {object} options - The options to create the Parameter with
	 * @param {"subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user"} options.type - The type of the parameter
	 * @param {string} options.name - The name of the parameter
	 * @param {string} options.description - The description of the parameter
	 * @param {boolean} options.isRequired - Whether the parameter is required
	 * @param {boolean} options.isAutocomplete - Whether the parameter is autocomplete
	 * @param {{[autocomplete_entry: string]: string}} options.autocomplete - The autocomplete options
	 * @param {number} options.min_value - The minimum value
	 * @param {number} options.max_value - The maximum value
	 * @param {Parameter[]} options.subparameters - The subparameters
	 * @param {Parameter[]} options.subcommands - The subcommands
	 */
	constructor({
		type,
		name,
		description,
		isRequired = true,
		isAutocomplete = false,
		min_value = undefined,
		max_value = undefined,
		autocomplete = undefined,
		subparameters = [],
		subcommands = [],
	}: {
		type: "subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user";
		name: string;
		description: string;
		isRequired?: boolean;
		isAutocomplete?: boolean;
		min_value?: number;
		max_value?: number;
		autocomplete?: {[autocomplete_entry: string]: string};
		subparameters?: Parameter[];
		subcommands?: Parameter[];
	}) {
		this.type = type;
		this.name = name;
		this.description = description;
		this.isRequired = isRequired;
		this.isAutocomplete = isAutocomplete;
		this.min_value = min_value;
		this.max_value = max_value;
		this.autocomplete = autocomplete;
		this.subparameters = subparameters;
		this.subcommands = subcommands;
	}

	/**
	 * Adds parameter to command or subcommand
	 * @param command The command data or subcommand you want the paramter added to.
	 * @returns The command or subcommand with the added parameter
	 */
	addToCommand(command: Record<string, any>) {
		const type = toTitleCase(this.type);

		if (type === "Subcommand") {
			// @ TODO: run it and Fix this subcommand instance of problem
			this.addSubcommandToCommand(command);
		} else if (type === "Subcommandgroup") {
			// @ TODO: run it and Fix this subcommand instance of problem
			this.addSubcommandGroupToCommand(command);
		}
		else {
			command[`add${type}Option`]((option: ApplicationCommandOptionBase) => {
				option
					.setName(this.name)
					.setDescription(this.description)
					.setRequired(this.isRequired)

				if (this.type === "string") {
					if (
						'setAutocomplete' in option &&
						typeof option.setAutocomplete === 'function'
					)
						option.setAutocomplete(this.isAutocomplete)
					else
						throw new Error(`Option ${option.name} does not support autocomplete.`);
				}

				if (this.min_value) {
					if (
						'setMinValue' in option &&
						typeof option.setMinValue === 'function'
					)
						option.setMinValue(this.min_value);
					else
						throw new Error(`Option ${option.name} does not support min_value.`);
				}

				if (this.max_value) {
					if (
						'setMaxValue' in option &&
						typeof option.setMaxValue === 'function'
					)
						option.setMaxValue(this.max_value);
					else
						throw new Error(`Option ${option.name} does not support max_value.`);
				}

				if (this.autocomplete) {
					if (
						'addChoices' in option &&
						typeof option.addChoices === 'function'
					)
						option.addChoices(
							...Object.entries(this.autocomplete).map(entry => {
								const name = entry[0];
								const value = entry[1];

								return {name, value};
							})
						)
					else
						throw new Error(`Option ${option.name} does not support autocomplete.`);
				}

				return option;
			})
		}

		return command;
	}

	/**
	 * Adds a subcommand to the given command with the same name and description as the Parameter.
	 * The subcommand's options are then set to the subparameters of the Parameter.
	 * @param command The command to add the subcommand to.
	 * @returns The command with the added subcommand.
	 */
	addSubcommandToCommand(command: Record<string, any>) {
		command.addSubcommand( (subcommand: Record<string, any>) => {
			subcommand
				.setName(this.name)
				.setDescription(this.description);

			this.subparameters.forEach(subparameter => {
				subcommand = subparameter.addToCommand(subcommand);
			});

			return subcommand;
		})

		return command;
	}
	addSubcommandGroupToCommand(command: Record<string, any>) {
		command.addSubcommandGroup( (subcommand_group: Record<string, any>) => {
			subcommand_group
				.setName(this.name)
				.setDescription(this.description);

			this.subcommands.forEach(subcommand => {
				subcommand_group = subcommand.addToCommand(subcommand_group);
			});

			return subcommand_group;
		})

		return command;
	}
}