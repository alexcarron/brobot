const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { Parameter } = require("./parameter");

/**
 * Represents a Discord command.
 * @class
 */
class SlashCommand {
	name;
	description;

	/** @field {number = 0} Seconds a user must wait before running this command again */
	cooldown;

	/** @field {boolean = false} If users should be able to run this command in DMs */
	allowsDMs;

	/** @field {string[]} IDs of servers this command can only be run in */
	required_servers;

	/** @field {string[]} IDs of channels this command can only be run in */
	required_channels;

	/** @field {string[]} IDs of channel categories this command can only be run in */
	required_categories;

	/** @field {string[]} Names of roles users must have to run this command */
	required_roles;

	/** @field {PermissionFlagsBits[]} Permissions that users must have to run this command */
	required_permissions;

	/** @field {Parameter[]} Parameters that users can enter when running the command */
	parameters;

	/** @field {boolean} If the command is currently in development */
	isInDevelopment;

	/**
	 * @type {(interaction: CommandInteraction) => any} A function which takes a discord.js Interaction that executes when the command is run
	 * */
	execute;

	/**
	 * @param {string} name
	 * @param {string} description
	 * @param {number} [cooldown = 0] Seconds a user must wait before running this command again
	 * @param {boolean} [allowsDMs = false] If users should be able to run this command in DMs
	 * @param {string[]} [required_servers] IDs of servers this command can only be run in
	 * @param {string[]} [required_channels] IDs of channels this command can only be run in
	 * @param {string[]} [required_categories] IDs of channel categories this command can only be run in
	 * @param {string[]} [required_roles] Names of roles users must have to run this command
	 * @param {PermissionFlagsBits[]} [required_permissions] Permissions that users must have to run this command
	 * @param {(Interaction) => any} A function which takes a discord.js Interaction that executes when the command is run
	 * @param {Parameter[]} [parameters = []] Parameters that users can enter when running the command
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
		execute = async (interaction) => {},
		autocomplete = async (interaction) => {},
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
	 *
	 * @returns {SlashCommand} The configured SlashCommand instance.
	 */
	getCommand() {

		const data = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);

		this.parameters.forEach(async parameter => {
			parameter.addToCommand(data)
		});

		if (this.required_permissions && this.required_permissions.length > 0) {
			const default_member_permissions =
			this.required_permissions.reduce((accum_permissions, permission_bit) => accum_permissions | permission_bit, this.required_permissions[0]);

			data.setDefaultMemberPermissions(default_member_permissions)
		}

		data.setDMPermission(this.allowsDMs)

		const command = this;
		command.data = data;

		return command;
	}

	async getParamByName(name) {
		return this.parameters.find(parameter => parameter.name.toLowerCase() === name.toLowerCase())
	}
}

module.exports = SlashCommand;