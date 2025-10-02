import { ApplicationCommandOptionBase, Attachment, GuildMember, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, TextChannel, User } from 'discord.js';
import { toTitleCase } from '../../utilities/string-manipulation-utils';
import { Role } from '../rapid-discord-mafia/role';
import { ToCamelCase } from '../../utilities/types/casing-types';
import { isStringToStringRecord } from '../../utilities/types/type-guards';
import { AutocompleteChoicesResolvable } from './autocomplete-utils';

export const ParameterTypes = Object.freeze({
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

export type ParameterType = typeof ParameterTypes[keyof typeof ParameterTypes];

type TypeOfParam<
	TypeString extends string,
	SubCommand extends Parameter[] = []
> =
	TypeString extends 'subcommand'
		? ParamNameToType<SubCommand>
	: TypeString extends 'string'
		? string
	: TypeString extends 'channel'
		? TextChannel
	: TypeString extends 'attachment'
		? Attachment
	: TypeString extends 'boolean'
		? boolean
	: TypeString extends 'mentionable'
		? NonNullable<GuildMember | Role | User>
	: TypeString extends 'number'
		? number
	: TypeString extends 'integer'
		? number
	: TypeString extends 'role'
		? Role
	: TypeString extends 'user'
		? User
	: any;

export type ParamNameToType<Parameters extends readonly Parameter[]> = {
  [
		Param in Parameters[number] as
			Param extends Parameter<any, any, infer Name>
				? ToCamelCase<Name>
				: never
	]:
    Param extends Parameter<infer Type, infer Subcommands, string>
      ? TypeOfParam<Type, Subcommands>
      : never;
};


type StringParameterOptions = {
	isAutocomplete?: boolean;
	autocomplete?:
		| ((enteredValue: string) => Promise<AutocompleteChoicesResolvable> | AutocompleteChoicesResolvable)
		| {[autocomplete_entry: string]: string};
}

type NumberParameterOptions = {
	min_value?: number;
	max_value?: number;
}

type SubcommandParameterOptions<
	Subparameters extends Parameter[]
> = {
	subparameters?: Subparameters;
}

/**
 * Represents a Discord command parameter.
 * @class
 */
export class Parameter<
	Type extends ParameterType = ParameterType,
	Subparameters extends Parameter[] =
		Parameter<ParameterType, any, string>[],
	Name extends string = string,
> {
	type;

	name;

	description;

	isRequired;

	isAutocomplete;

	min_value;

	max_value;

	autocomplete:
		| ((enteredValue: string) => Promise<AutocompleteChoicesResolvable> | AutocompleteChoicesResolvable)
		| {[autocomplete_entry: string]: string}
		| undefined;

	subparameters = [] as unknown as Subparameters;

	/**
	 * Creates a new Parameter.
	 * @param options - The options to create the Parameter with
	 * @param options.type - The type of the parameter
	 * @param options.name - The name of the parameter
	 * @param options.description - The description of the parameter
	 * @param options.isRequired - Whether the parameter is required
	 * @param options.isAutocomplete - Whether the parameter is autocomplete
	 * @param options.autocomplete - The autocomplete options
	 * @param options.min_value - The minimum value
	 * @param options.max_value - The maximum value
	 * @param options.subparameters - The subparameters
	 * @param options.subcommands - The subcommands
	 */
	constructor(options:
		& {
			type: Type;
			name: Name;
			description: string;
			isRequired?: false;
			isOptional?: true;
		}
		& (Type extends 'string' ? StringParameterOptions : {})
		& (Type extends 'number' | 'integer' ? NumberParameterOptions : {})
		& (Type extends 'subcommand' ? SubcommandParameterOptions<Subparameters> : {})
	) {
		const {
			type,
			name,
			description,
			isRequired = true,
			isOptional = false,
		} = options;

		this.type = type;
		this.name = name;
		this.description = description;
		this.isRequired =
			!isRequired || isOptional ? false : true;

		if (type === 'subcommand') {
			const { subparameters = [] as unknown as Subparameters } = options as SubcommandParameterOptions<Subparameters>;
			this.subparameters = subparameters;
		}

		if (type === 'number' || type === 'integer') {
			const { min_value, max_value } = options as NumberParameterOptions;
			this.min_value = min_value;
			this.max_value = max_value;
		}

		if (type === 'string') {
			const { isAutocomplete, autocomplete } = options as StringParameterOptions;
			this.isAutocomplete = isAutocomplete;
			this.autocomplete = autocomplete;
		}
	}

	/**
	 * Adds parameter to command or subcommand
	 * @param command The command data or subcommand you want the paramter added to.
	 * @returns The command or subcommand with the added parameter
	 */
	addToCommand<CommandBuilder extends SlashCommandBuilder | SlashCommandSubcommandGroupBuilder | SlashCommandSubcommandBuilder>(command: CommandBuilder) {
		const type = toTitleCase(this.type);

		if (type === "Subcommand") {
			if (
				command instanceof SlashCommandBuilder &&
				command instanceof SlashCommandSubcommandGroupBuilder
			) {
				this.addSubcommandToCommand(command);
			}
		}
		else if (type === "Subcommandgroup") {
			if (command instanceof SlashCommandBuilder)
				this.addSubcommandGroupToCommand(command);
		}
		else {
			// @ts-ignore
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
						option.setAutocomplete(
							(this.isAutocomplete ?? false) ||
							(this.autocomplete !== undefined)
						);
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

				if (
					this.autocomplete &&
					isStringToStringRecord(this.autocomplete)
				) {
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
	addSubcommandToCommand(command: SlashCommandBuilder  | SlashCommandSubcommandGroupBuilder) {
		command.addSubcommand(
			(subcommand: SlashCommandSubcommandBuilder) => {
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
	addSubcommandGroupToCommand(command: SlashCommandBuilder) {
		command.addSubcommandGroup( (subcommand_group: SlashCommandSubcommandGroupBuilder) => {
			subcommand_group
				.setName(this.name)
				.setDescription(this.description);

			this.subparameters.forEach(subparameter => {
				subcommand_group = subparameter.addToCommand(subcommand_group);
			});

			return subcommand_group;
		})

		return command;
	}
}