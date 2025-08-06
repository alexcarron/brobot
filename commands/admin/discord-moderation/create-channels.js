const { ChannelType, PermissionFlagsBits, ChatInputCommandInteraction, AutocompleteInteraction } = require("discord.js");
const { ParameterType, Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction, createChannel, editReplyToInteraction } = require("../../../utilities/discord-action-utils");
const { getStringParamValue, getRequiredIntegerParam, getRequiredStringParam, fetchChannelsOfGuild } = require("../../../utilities/discord-fetch-utils");
const { incrementEndNumber } = require("../../../utilities/string-manipulation-utils");

const Parameters = {
	Name: new Parameter({
		type: ParameterType.STRING,
		name: "channel-name",
		description: "The name of the channel",
		isRequired: true,
	}),
	Amount: new Parameter({
		type: ParameterType.INTEGER,
		name: "number-of-channels",
		description: "The number of channels to create",
		isRequired: true,
	}),
	Category: new Parameter({
		type: ParameterType.STRING,
		name: "parent-category",
		description: "The category you want to add the channels to",
		isAutocomplete: true,
		isRequired: false,
	}),
	Message: new Parameter({
		type: ParameterType.STRING,
		name: "message",
		description: "The first message to send in each of the channels",
		isRequired: false,
	}),
}

module.exports = new SlashCommand({
	name: "create-channels",
	description: "Creates multiple channels in a specified category",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Name,
    Parameters.Amount,
		Parameters.Category,
		Parameters.Message,
	],

	/**
	 * @param {ChatInputCommandInteraction} interaction - The interaction whose reply is being updated.
	 */
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const guild = interaction.guild;
		if (guild === null) {
			await editReplyToInteraction(interaction,
				"This command can only be used in a server."
			);
			return;
		}

		let channelName = getRequiredStringParam(interaction, Parameters.Name.name);
		const amount = getRequiredIntegerParam(interaction, Parameters.Amount.name);
		const categoryID = getStringParamValue(interaction, Parameters.Category.name);
		const message = getStringParamValue(interaction, Parameters.Message.name);

		if (amount <= 0) {
			await editReplyToInteraction(interaction,
				"Number of channels must be greater than 0."
			);
			return;
		}

		channelName += "-1"

		for (let numChannel = 1; numChannel <= amount; numChannel++) {
			const channelOptions = {
				guild: guild,
				name: channelName,
			}

			if (categoryID)
				channelOptions.parentCategory = categoryID;

			const newChannel = await createChannel(channelOptions);

			if (message) {
				newChannel.send(message);
			}

			channelName = incrementEndNumber(channelName);
		}

		await editReplyToInteraction(interaction,
			`Successfully created ${amount} channels.`
		);
	},

	/**
	 * @param {AutocompleteInteraction} interaction - The interaction whose reply is being updated.
	 */
	autocomplete: async function autocomplete(interaction) {
		let autocompleteValues;

		const focusedParameter = await interaction.options.getFocused(true);
		if (!focusedParameter) return;
		const enteredValue = focusedParameter.value;

		if (interaction.guild === null)
			return;

		const allChannels = await fetchChannelsOfGuild(interaction.guild);


		const allCategories = allChannels.filter(channel => channel.type === ChannelType.GuildCategory);

		autocompleteValues = allCategories
			.map((category) => {
				return {name: category.name, value: category.id}
			})
			.filter(autocomplete_entry => {
				return autocomplete_entry.name.toLowerCase().startsWith(enteredValue.toLowerCase())
			});

		if (Object.values(autocompleteValues).length <= 0) {
			autocompleteValues = [{name: "Sorry, there are no categories to choose from", value: "N/A"}];
		}
		else if (Object.values(autocompleteValues).length > 25) {
			autocompleteValues.splice(25);
		}

		await interaction.respond(
			autocompleteValues
		);
	}
});