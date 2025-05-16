const { toTitleCase } = require('../../utilities/text-formatting-utils.js');
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

	/** @field {Paramater[]} Subcommand parameters specific to this subcommandgroup parameter */
	subcommands;

	/**
	 * @param {"subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user"} type "subcommand" | "string" | "channel" | "attachment" | "boolean" | "mentionable" | "number" | "integer" | "role" | "user"
	 * @param {string} name
	 * @param {string} description
	 * @param {boolean} [isRequired = true]
	 * @param {boolean} [isAutocomplete = true]
	 * @param {{[autocomplete_entry: string]: string}} [autocomplete]
	 * @param {number} [min_value]
	 * @param {number} [max_value]
	 * @param {Parameter[]} [subparameters = []]
	 * @param {SubcommandParameter[]} [subcommands = []]
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
		subcommands = [],
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
	 *
	 * @param {object} command The command data or subcommand you want the paramter added to.
	 */
	addToCommand(command) {
		const type = toTitleCase(this.type);

		if (type === "Subcommand") {
			// @ TODO: run it and Fix this subcommand instance of problem
			this.addSubcommandToCommand(command);
		} else if (type === "Subcommandgroup") {
			// @ TODO: run it and Fix this subcommand instance of problem
			this.addSubcommandGroupToCommand(command);
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

		return command;
	}
	addSubcommandToCommand(command) {
		command.addSubcommand( (subcommand) => {
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
	addSubcommandGroupToCommand(command) {
		command.addSubcommandGroup( (subcommand_group) => {
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

module.exports = Parameter;