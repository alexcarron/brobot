const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { Parameter } = require("./parameter");

/**
 * Represents a Discord command.
 * @class
 */
class SlashCommand {
	/** @type {string} The name of the command */
	name;

	/** @type {string} The description of the command */
	description;

	/** @type {number} Seconds a user must wait before running this command again */
	cooldown;

	/** @type {boolean} If users should be able to run this command in DMs */
	allowsDMs;

	/** @type {string[]} IDs of servers this command can only be run in */
	required_servers;

	/** @type {string[]} IDs of channels this command can only be run in */
	required_channels;

	/** @type {string[]} IDs of channel categories this command can only be run in */
	required_categories;

	/** @type {string[] | string[][]} Names of roles users must have to run this command */
	required_roles;

	/** @type {bigint[]} Permissions that users must have to run this command */
	required_permissions;

	/** @type {Parameter[]} Parameters that users can enter when running the command */
	parameters;

	/** @type {boolean} If the command is currently in development */
	isInDevelopment;

	/**
	 * @type {(interaction: CommandInteraction) => any} A function which takes a discord.js Interaction that executes when the command is run
	 */
	execute;

/**
 * Create a new SlashCommand.
 * @param {object} options - The options to create the SlashCommand with
 * @param {string} options.name - The name of the command
 * @param {string} options.description - The description of the command
 * @param {number} [options.cooldown] - The cooldown for the command in seconds
 * @param {boolean} [options.allowsDMs] - If the command can be run in DMs
 * @param {string[]} [options.required_servers] - The IDs of the servers the command can only be run in
 * @param {string[]} [options.required_channels] - The IDs of the channels the command can only be run in
 * @param {string[]} [options.required_categories] - The IDs of the channel categories the command can only be run in
 * @param {string[] | string[][]} [options.required_roles] - The names of the roles users must have to run the command
 * @param {bigint[]} [options.required_permissions] - The permissions users must have to run the command using PermissionFlagsBits
 * @param {Parameter[]} [options.parameters] - The parameters for the command
 * @param {(interaction: CommandInteraction) => Promise<void>} [options.execute] - The function to execute when the command is run
 * @param {(interaction: CommandInteraction) => Promise<void>} [options.autocomplete] - The function to execute when the command is autocompleted
 * @param {boolean} [options.isInDevelopment] - If the command is currently in development
 */
	constructor({
		name,
		description,
		cooldown = 0,
		allowsDMs = false,
		required_servers,
		required_channels,
		required_categories,
		required_roles,
		required_permissions,
		parameters = [],
		execute = async () => {},
		autocomplete = async () => {},
		isInDevelopment = false,
	}) {
		this.name = name;
		this.description = description;
		this.cooldown = cooldown;
		this.allowsDMs = allowsDMs;
		this.required_servers = required_servers;
		this.required_channels = required_channels;
		this.required_categories = required_categories;
		this.required_roles = required_roles;
		this.required_permissions = required_permissions;
		this.parameters = parameters;
		this.execute = execute;
		this.autocomplete = autocomplete;
		this.isInDevelopment = isInDevelopment;
	}

	/**
	 * Constructs and returns a SlashCommand object configured with its name, description,
	 * parameters, required permissions, and DM permissions.
	 * @returns {SlashCommand} The configured SlashCommand instance.
	 */
	getCommand() {

		const data = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);

		this.parameters.forEach(parameter => {
			parameter.addToCommand(data)
		});

		if (this.required_permissions && this.required_permissions.length > 0) {
			const default_member_permissions =
			this.required_permissions.reduce((accum_permissions, permission_bit) =>
				// @ts-ignore
				accum_permissions | permission_bit,
				this.required_permissions[0]
			);

			// @ts-ignore
			data.setDefaultMemberPermissions(default_member_permissions)
		}

		data.setDMPermission(this.allowsDMs)

		const command = this;
		command.data = data;

		return command;
	}

	/**
	 * Finds a parameter by its name from the command's parameters.
	 * @param {string} name - The name of the parameter to search for.
	 * @returns {Parameter | undefined} The found parameter, or undefined if not found.
	 */
	getParamByName(name) {
		return this.parameters.find(parameter =>
			parameter.name.toLowerCase() === name.toLowerCase()
		);
	}
}

module.exports = SlashCommand;