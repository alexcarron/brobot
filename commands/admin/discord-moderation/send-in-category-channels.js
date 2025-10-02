const { ChannelType, PermissionFlagsBits, TextChannel } = require("discord.js");
const { ParameterTypes, Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction } = require("../../../utilities/discord-action-utils");
const { fetchChannelsInCategory, getGuildOfInteraction, getRequiredStringParam, fetchCategory, fetchChannelsOfGuild } = require("../../../utilities/discord-fetch-utils");
const { wait } = require("../../../utilities/realtime-utils");

const Parameters = {
	Category: new Parameter({
		type: ParameterTypes.STRING,
		name: "category",
		description: "The category with the channels to send the message in",
		isAutocomplete: true,
	}),
	Message: new Parameter({
		type: ParameterTypes.STRING,
		name: "message",
		description: "The message to send",
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

	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const guild = getGuildOfInteraction(interaction);

		const categoryID = getRequiredStringParam(interaction, Parameters.Category.name);
		const category = await fetchCategory(guild, categoryID);
		const message = getRequiredStringParam(interaction, Parameters.Message.name);

		// All channels in the category
		const channels = await fetchChannelsInCategory(guild, categoryID)

		let numMessagesSent = 0;

		channels.forEach(async (channel) => {
			if (!(channel instanceof TextChannel)) return;

			await channel.send(message);
			numMessagesSent++;

			// Rate limit to prevent spamming Discord API
			if (numMessagesSent % 10 === 0) {
				await wait({seconds: 0.5});
			}
		});

		await editReplyToInteraction(interaction,
			`Sent message in \`${channels.length}\` channels in **${category.name}**`
		);
	},

	autocomplete: async function autocomplete(interaction) {
		let autocompleteValues;

		const focusedParameter = interaction.options.getFocused(true);
		if (!focusedParameter) return;
		const enteredValue = focusedParameter.value;

		const guild = getGuildOfInteraction(interaction);
		const allChannels = await fetchChannelsOfGuild(guild);

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