import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Parameter, ParamNameToType } from "./parameter";
import { toCamelCase } from "../../utilities/string-manipulation-utils";
import { isString, isStringToStringRecord, isUndefined } from "../../utilities/types/type-guards";
import { filterAutocompleteByEnteredValue, getEnteredValueOfParameter, getEnteredValueOfParameters, isAutocompleteForParameter, limitAutocompleteChoices, toAutocompleteChoices } from "./autocomplete-utils";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { attempt } from "../../utilities/error-utils";

/**
 * Build a parameters object from the interaction and Parameter[] definition.
 * Returns a value typed as ParamNameToType<Parameters> (asserted).
 * @param interaction - The interaction that triggered the command
 * @param parameters - The parameters to collect from the interaction.
 * @returns A value typed as ParamNameToType<Parameters>.
 */
function collectParameters<Parameters extends readonly Parameter[]>(
  interaction: ChatInputCommandInteraction,
  parameters: Parameters,
): any {
  const out: Record<string, any> = {};

  for (const param of parameters) {
    const name = param.name;
		const functionParameterName = toCamelCase(name);

    switch (param.type) {
      case 'string':
        out[functionParameterName] = interaction.options.getString(name, param.isRequired);
        break;

      case 'integer':
        out[functionParameterName] = interaction.options.getInteger(name, param.isRequired ?? false);
        break;

      case 'number':
        out[functionParameterName] = interaction.options.getNumber(name, param.isRequired ?? false);
        break;

      case 'boolean':
        out[functionParameterName] = interaction.options.getBoolean(name, param.isRequired ?? false);
        break;

      case 'user':
        out[functionParameterName] = interaction.options.getUser(name, param.isRequired ?? false);
        break;

      case 'role':
        out[functionParameterName] = interaction.options.getRole(name, param.isRequired ?? false);
        break;

      case 'channel':
        out[functionParameterName] = interaction.options.getChannel(name, param.isRequired ?? false);
        break;

      case 'attachment':
        out[functionParameterName] = interaction.options.getAttachment(name, param.isRequired ?? false);
        break;

      case 'mentionable':
        // returns Role | User | GuildMember
        out[functionParameterName] = interaction.options.getMentionable(name, param.isRequired ?? false);
        break;

      case 'subcommand':
        // If this subcommand was executed, gather its subparameters
        // getSubcommand(false) returns the subcommand name or throws if not present depending on version.
        // We'll use try/catch to be safe.
        try {
          const sub = interaction.options.getSubcommand(false);
          if (sub === name) {
            // recursively collect parameters for the subcommand's options
            out[functionParameterName] = collectParameters(interaction, param.subparameters as Parameter[]);
          } else {
            // if different subcommand was used, skip or leave undefined
            // (you could also set out[name] = undefined explicitly)
          }
        } catch {
          // no subcommand present at all
        }
        break;

      default:
        // fallback — read as string
        out[functionParameterName] = interaction.options.getString(name, param.isRequired ?? false);
        break;
    }
  }

  return out;
}

/**
 * Represents a Discord command.
 * @class
 */
export class SlashCommand<
	Parameters extends Parameter[] = Parameter[]
>{
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
	public required_permissions: bigint[];

	/**
	 * Parameters that users can enter when running the command
	 */
	public readonly parameters: Parameters;

	/**
	 * If the command is still in development.
	 *
	 * When true, the command is
	 * - Deployed in the development environment
	 * - Not deployed in production
	 * - Can only be used by developers
	 */
	public readonly isInDevelopment: boolean = false;

	/**
	 * If the command is not finished but can be used by users for testing purposes. Overrides `isInDevelopment`
	 *
	 * When true, the command is
	 * - Deployed in the development environment
	 * - Not deployed in production
	 * - Can be used by all users
	 */
	public readonly isInUserTesting: boolean = false;

	/**
	 * If the command should automatically defer the command interaction.
	 */
	public readonly isAutoDeffered: boolean = true;

	/**
	 * A function which takes a discord.js Interaction that executes when the command is autocompleted
	 */
	public readonly autocomplete: (interaction: AutocompleteInteraction) => Promise<any>;

	/**
	 * A function which takes a discord.js Interaction that executes when the command is run
	 */
	public readonly execute: (
		interaction: ChatInputCommandInteraction,
		parameters: ParamNameToType<Parameters>,
	) => Promise<unknown> | unknown;

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
		parameters = [] as unknown as Parameters,
		execute,
		autocomplete = async () => {},
		isInDevelopment = false,
		isInUserTesting = false,
		disableAutoDefer = false,
	}: {
		name: string;
		description: string;
		execute: (
			interaction: ChatInputCommandInteraction,
			parameters: ParamNameToType<Parameters>,
		) => Promise<unknown> | unknown;
		cooldown?: number;
		allowsDMs?: boolean;
		required_servers?: string[];
		required_channels?: string[];
		required_categories?: string[];
		required_roles?: string[] | string[][];
		required_permissions?: bigint[];
		parameters?: Parameters;
		autocomplete?: (interaction: AutocompleteInteraction) => Promise<any>;
		isInDevelopment?: boolean;
		isInUserTesting?: boolean;
		disableAutoDefer?: boolean;
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
		this.isInUserTesting = isInUserTesting;
		this.isAutoDeffered = !disableAutoDefer;
	}

	/**
	 * Constructs and returns a SlashCommand object configured with its name, description,
	 * parameters, required permissions, and DM permissions.
	 * @returns The configured SlashCommand instance.
	 */
	getCommand(): this {
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

	async handleExecution(interaction: ChatInputCommandInteraction): Promise<any> {
		if (this.isAutoDeffered) {
			await attempt(deferInteraction(interaction))
				.ignoreError()
				.execute();
		}

		const params = collectParameters(interaction, this.parameters);

		const result = await this.execute(interaction, params);

		if (isString(result))
			await replyToInteraction(interaction, result);
	}

	async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
		for (const parameter of this.parameters) {
			if (
				!isUndefined(parameter.autocomplete) &&
				!isStringToStringRecord(parameter.autocomplete)
			) {
				if (!isAutocompleteForParameter(interaction, parameter))
					continue;

				const enteredValue = getEnteredValueOfParameter(interaction, parameter.name);
				const user = interaction.user;
				const enteredValueByParameter = getEnteredValueOfParameters(interaction);
				
				const autocompleteChoicesResolvable = await parameter.autocomplete(enteredValue, user, enteredValueByParameter);

				const choices = toAutocompleteChoices(autocompleteChoicesResolvable);

				await interaction.respond(
					limitAutocompleteChoices(
					filterAutocompleteByEnteredValue(
						choices, enteredValue
					)
					)
				);
			}
		}
		await this.autocomplete(interaction);
	}
}

