import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Parameter } from "./parameter";

/**
 * Represents a Discord command.
 * @class
 */
export class SlashCommand {
	/**
	 * The name of the command
	 */
	public readonly name: string;

	/**
	 * The description of the command
	 */
	public readonly description: string;

	/**
	 * Seconds a user must wait before running this command again
	 */
	public readonly cooldown: number;

	/**
	 * If users should be able to run this command in DMs
	 */
	public readonly allowsDMs: boolean;

	/**
	 * IDs of servers this command can only be run in
	 */
	public readonly required_servers: string[];

	/**
	 * IDs of channels this command can only be run in
	 */
	public readonly required_channels: string[];

	/**
	 * IDs of channel categories this command can only be run in
	 */
	public readonly required_categories: string[];

	/**
	 * Names of roles users must have to run this command
	 */
	public readonly required_roles: string[] | string[][];

	/**
	 * Permissions that users must have to run this command
	 */
	public readonly required_permissions: bigint[];

	/**
	 * Parameters that users can enter when running the command
	 */
	public readonly parameters: Parameter[];

	/**
	 * If the command is currently in development
	 */
	public readonly isInDevelopment: boolean;

	/**
	 * A function which takes a discord.js Interaction that executes when the command is autocompleted
	 */
	public readonly autocomplete: (interaction: AutocompleteInteraction) => Promise<any>;

	/**
	 * A function which takes a discord.js Interaction that executes when the command is run
	 */
	public readonly execute: (interaction: ChatInputCommandInteraction, isTestOrContext?: any, isTest?: any) => Promise<any>;

	public data: any;

	constructor({
		name,
		description,
		cooldown = 0,
		allowsDMs = false,
		required_servers = [],
		required_channels = [],
		required_categories = [],
		required_roles = [],
		required_permissions = [],
		parameters = [],
		execute,
		autocomplete = async () => {},
		isInDevelopment = false,
	}: {
		name: string;
		description: string;
		execute: (interaction: ChatInputCommandInteraction, isTestOrContext?: any, isTest?: any) => Promise<any>;
		cooldown?: number;
		allowsDMs?: boolean;
		required_servers?: string[];
		required_channels?: string[];
		required_categories?: string[];
		required_roles?: string[] | string[][];
		required_permissions?: bigint[];
		parameters?: Parameter[];
		autocomplete?: (interaction: AutocompleteInteraction) => Promise<any>;
		isInDevelopment?: boolean;
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

		this.data = data;
		return this;
	}

	/**
	 * Determines if the command is a global command that can be run in any server.
	 * @returns Whether the command is a global command.
	 */
	isGlobalCommand(): boolean {
		return this.required_servers.length <= 0;
	}

	/**
	 * Determines if the command is a server-based command that can only be run in specific servers.
	 * @returns Whether the command is a server-based command.
	 */
	isServerBasedCommand(): boolean {
		return !this.isGlobalCommand();
	}

	/**
	 * Finds a parameter by its name from the command's parameters.
	 * @param name - The name of the parameter to search for.
	 * @returns The found parameter, or undefined if not found.
	 */
	getParamByName(name: string): Parameter | undefined {
		return this.parameters.find(parameter =>
			parameter.name.toLowerCase() === name.toLowerCase()
		);
	}
}

