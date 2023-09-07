const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require("discord.js");
const { toTitleCase } = require("../functions");

/**
 * Represents a Discord command parameter.
 * @class
 */
class Parameter {
	/** @field {"subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user"}*/
	type;

	/** @field {string}*/
	name;

	/** @field {string}*/
	description;

	/** @field {boolean}*/
	isRequired;

	/** @field {boolean}*/
	isAutocomplete;

	/** @field {number}*/
	min_value;

	/** @field {number}*/
	max_value;

	/** @field {{[autocomplete_entry: string]: string}} All autocomplete entries */
	autocomplete;

	/** @field {Paramater[]} Paramaters specific to this subcommand parameter */
	subparameters;

	/**
	 * @param {"subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user"} type
	 * @param {string} name
	 * @param {string} description
	 * @param {boolean} [isRequired = true]
	 * @param {boolean} [isAutocomplete = true]
	 * @param {{[autocomplete_entry: string]: string}} [autocomplete]
	 * @param {number} [min_value]
	 * @param {number} [max_value]
	 * @param {Parameter[]} [subparameters = []]
	 */
	constructor({
		type,
		name,
		description,
		isRequired = true,
		isAutocomplete = false,
		min_value,
		max_value,
		autocomplete,
		subparameters = [],
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
	}

	/**
	 * Adds parameter to command or subcommand
	 *
	 * @param {object} command The command data or subcommand you want the paramter added to.
	 */
	addToCommand(command) {
		// console.log("adding Paramater...");
		// console.log(this);
		// console.log(" to Command:")
		// console.log({command});
		// console.log(`SlashCommand Instance? ${command instanceof SlashCommandBuilder}`);
		// console.log(`Subcommand Instance? ${command instanceof SlashCommandSubcommandBuilder}`);

		const type = toTitleCase(this.type);
		// console.log({type});

		if (type === "Subcommand") {
			// @ TODO: run it and Fix this subcommand instance of problem
			this.addSubcommandToCommand(command);
			// console.log({command});
		}
		else {
			command[`add${type}Option`](option => {
				option
					.setName(this.name)
					.setDescription(this.description)
					.setRequired(this.isRequired)

				if (this.type === "string") {
					option.setAutocomplete(this.isAutocomplete)
				}

				if (this.min_value) {
					option.setMinValue(this.min_value);
				}

				if (this.max_value) {
					option.setMaxValue(this.max_value);
				}

				if (this.autocomplete) {
					option.addChoices(
						...Object.entries(this.autocomplete).map(entry => {
							const name = entry[0];
							const value = entry[1];

							return {name, value};
						})
					)
				};

				return option;
			})
		}

		// console.log(`SlashCommand Instance? ${command instanceof SlashCommandBuilder}`);
		// console.log(`Subcommand Instance? ${command instanceof SlashCommandSubcommandBuilder}`);

		return command;
	}
	addSubcommandToCommand(command) {
		// console.log("Adding subcommand paramater:");
		// console.log(this);
		command.addSubcommand( (subcommand) => {
			// console.log(`Subcommand Instance? ${subcommand instanceof SlashCommandSubcommandBuilder}`);

			subcommand
				.setName(this.name)
				.setDescription(this.description);

			// console.log({subcommand});

			this.subparameters.forEach(subparameter => {
				// console.log("Adding subparamater to subcommand:");
				// console.log({subparameter});

				subcommand = subparameter.addToCommand(subcommand);
			});

			return subcommand;
		})

		return command;
	}
}

module.exports = Parameter;