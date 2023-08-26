const { SlashCommandBuilder } = require("discord.js");

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
	required_server;

	/** @field {string[]} IDs of channels this command can only be run in */
	required_channels;

	/** @field {string[]} Names of roles users must have to run this command */
	required_roles;

	/** @field {PermissionFlagsBits[]} Permissions that users must have to run this command */
	required_permissions;

	/** @field {Paramter[]} Parameters that users can enter when running the command */
	required_permissions;

	/** @field {async function} The function that executes when the command is run */
	execute;

	/**
	 * @param {string} name
	 * @param {string} description
	 * @param {number} [cooldown = 0] Seconds a user must wait before running this command again
	 * @param {boolean} [allowsDMs = false] If users should be able to run this command in DMs
	 * @param {string[]} [required_server = []] IDs of servers this command can only be run in
	 * @param {string[]} [required_channels = []] IDs of channels this command can only be run in
	 * @param {string[]} [required_roles = []] Names of roles users must have to run this command
	 * @param {PermissionFlagsBits[]} [required_permissions = []] Permissions that users must have to run this command
	 * @param {function} [execute = async (interaction) => {}] The function that executes when the command is run
	 * @param {Parameter[]} [parameters = []] Parameters that users can enter when running the command
	 */
	constructor({
		name,
		description,
		cooldown = 0,
		allowsDMs = false,
		required_server = [],
		required_channels = [],
		required_roles = [],
		required_permissions = [],
		parameters = [],
		execute = async (interaction) => {},
	}) {
		this.name = name;
		this.description = description;
		this.cooldown = cooldown;
		this.allowsDMs = allowsDMs
		this.required_server = required_server
		this.required_channels = required_channels
		this.required_roles = required_roles
		this.required_permissions = required_permissions
		this.parameters = parameters
		this.execute = execute
	}

	async getCommand() {

		console.log(this);

		const data = new SlashCommandBuilder()
			.setName(this.name)
			.setDescription(this.description);

		console.log(this);

		await this.parameters.forEach(async parameter => {
			await parameter.addToCommand(data)
		});

		console.log(this);

		if (this.required_permissions.length > 0) {
			const default_member_permissions = await this.required_permissions.reduce((accum_permissions, permission_bit) => accum_permissions | permission_bit, this.required_permissions[0]);

			data.setDefaultMemberPermissions(default_member_permissions)
		}

		data.setDMPermission(this.allowsDMs)

		const command = this;
		command.data = data;

		return command;
	}
}

module.exports = SlashCommand;