import { ChatInputCommandInteraction, TextChannel, User } from "discord.js";
import { Parameter } from "../../services/command-creation/parameter";

/**
 * Resolves a parameter name given either a string or a Parameter object.
 * @param parameter - The parameter to resolve the name of.
 * @returns The resolved name of the parameter.
 */
function resolveParameterName(parameter: string | Parameter): string {
	return typeof parameter === "string"
		? parameter
		: parameter.name;
}

/**
 * Gets a number parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the number parameter or the parameter itself
 * @returns The value of the number parameter
 */
export function getNumberParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): number | null {
	const name = resolveParameterName(nameOrParameter);
	return interaction.options.getNumber(name);
}

/**
 * Gets a number parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the number parameter or the parameter itself
 * @returns The value of the number parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredNumberParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): number {
	const name = resolveParameterName(nameOrParameter);
	const value = getNumberParamValue(interaction, nameOrParameter);
	if (value === null || value === undefined)
		throw new Error(`getRequiredNumberParamValue: ${name} is required`);
	return value;
}

/**
 * Gets an integer parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the integer parameter or the parameter itself
 * @returns The value of the integer parameter
 */
export function getIntegerParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): number | null {
	const name = resolveParameterName(nameOrParameter);
	return interaction.options.getInteger(name);
}

/**
 * Gets an integer parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the integer parameter or the parameter itself
 * @returns The value of the integer parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredIntegerParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): number {
	const name = resolveParameterName(nameOrParameter);
	const value = getIntegerParamValue(interaction, nameOrParameter);
	if (value === null || value === undefined)
		throw new Error(`getRequiredIntegerParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a string parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the string parameter or the parameter itself
 * @returns The value of the string parameter
 */
export function getStringParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): string | null {
	const name = resolveParameterName(nameOrParameter);
	return interaction.options.getString(name);
}

/**
 * Gets a string parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the string parameter or the parameter itself
 * @returns The value of the string parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredStringParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): string {
	const name = resolveParameterName(nameOrParameter);
	const value = getStringParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredStringParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a user parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the user parameter or the parameter itself
 * @returns The value of the user parameter
 */
export function getUserParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): User | null {
	const name = resolveParameterName(nameOrParameter);
	return interaction.options.getUser(name);
}

/**
 * Gets a user parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the user parameter or the parameter itself
 * @returns The value of the user parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredUserParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): User {
	const name = resolveParameterName(nameOrParameter);
	const value = getUserParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredUserParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a channel parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the channel parameter
 * @returns The value of the channel parameter. If the parameter is not provided, or if the channel is not a valid channel, then undefined is returned.
 */
export function getChannelParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): TextChannel | undefined {
	const name = resolveParameterName(nameOrParameter);
	const channel = interaction.options.getChannel(name);

	if (channel instanceof TextChannel) {
		return channel;
	}

	return undefined;
}

/**
 * Gets a channel parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the channel parameter
 * @returns The value of the channel parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredChannelParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): TextChannel {
	const name = resolveParameterName(nameOrParameter);
	const value = getChannelParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredChannelParamValue: ${name} is required`);
	return value;
}

/**
 * Gets a boolean parameter value of a slash command by name.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the boolean parameter or the parameter itself
 * @returns The value of the boolean parameter
 */
export function getBooleanParamValue(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): boolean | null {
	const name = resolveParameterName(nameOrParameter);
	const boolean = interaction.options.getBoolean(name);
	return boolean;
}

/**
 * Gets a boolean parameter value of a slash command by name, and throws an error if the parameter is not provided.
 * @param interaction - The interaction whose reply is being updated.
 * @param nameOrParameter - The name of the boolean parameter or the parameter itself
 * @returns The value of the boolean parameter
 * @throws {Error} If the parameter is not provided
 */
export function getRequiredBooleanParam(interaction: ChatInputCommandInteraction, nameOrParameter: string | Parameter): boolean {
	const name = resolveParameterName(nameOrParameter);
	const value = getBooleanParamValue(interaction, name);
	if (value === null || value === undefined)
		throw new Error(`getRequiredBooleanParamValue: ${name} is required`);
	return value;
}

/**
 * Retrieves the subcommand or subcommand group used in a slash command interaction.
 * @param interaction - The interaction object from which to get the subcommand.
 * @returns The name of the subcommand or subcommand group used.
 * @throws {Error} If neither a subcommand nor a subcommand group is provided.
 */
export function getSubcommandUsed(interaction: ChatInputCommandInteraction): string {
	const subcommand = interaction.options.getSubcommandGroup() || interaction.options.getSubcommand();

	if (subcommand === null || subcommand === undefined)
		throw new Error("getSubcommandUsed: subcommand is required");

	return subcommand;
}
