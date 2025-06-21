const { CommandInteraction, ChannelType, PermissionFlagsBits } = require("discord.js");
const { ParameterType, Parameter } = require("../../../services/command-creation/parameter");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../../utilities/discord-action-utils");
const { getStringParamValue, fetchChannel, fetchChannelsInCategory } = require("../../../utilities/discord-fetch-utils");
const { wait } = require("../../../utilities/realtime-utils");

const Parameters = {
	Category: new Parameter({
		type: ParameterType.STRING,
		name: "category",
		description: "The category with the channels to send the message in",
		isAutocomplete: true,
		isRequired: true,
	}),
	Message: new Parameter({
		type: ParameterType.STRING,
		name: "message",
		description: "The message to send",
		isRequired: true,
	}),
}

module.exports = new SlashCommand({
	name: "send-in-category-channels",
	description: "Sends a message in all channels in a category",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Category,
		Parameters.Message,
	],

	/**
	 * @param {CommandInteraction} interaction
	 */
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const guild = interaction.guild;

		const categoryID = getStringParamValue(interaction, Parameters.Category.name);
		const category = await fetchChannel(guild, categoryID);
		const message = getStringParamValue(interaction, Parameters.Message.name);

		// All channels in the category
		const channels = await fetchChannelsInCategory(guild, categoryID)

		let numMessagesSent = 0;

		channels.forEach(async (channel) => {
			await channel.send(message);
			numMessagesSent++;

			// Rate limit to prevent spamming Discord API
			if (numMessagesSent % 10 === 0) {
				await wait({seconds: 0.5});
			}
		});

		await editReplyToInteraction(interaction,
			`Sent message in \`${channels.size}\` channels in **${category.name}**`
		);
	},

	/**
	 * @param {CommandInteraction} interaction
	 */
	autocomplete: async function autocomplete(interaction) {
		let autocompleteValues;

		const focusedParameter = await interaction.options.getFocused(true);
		if (!focusedParameter) return;
		const enteredValue = focusedParameter.value;

		const allChannels = await interaction.guild.channels.fetch();

		const allCategories = allChannels.filter(channel => channel.type === ChannelType.GuildCategory);

		autocompleteValues = allCategories
			.map((category) => {
				return {name: category.name, value: category.id}
			})
			.filter(autocomplete_entry => {
				return autocomplete_entry.name.toLowerCase().startsWith(enteredValue.toLowerCase())
			});

		console.log({ autocompleteValues  });

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