const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { ParameterTypes, Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, shuffleCategoryChannels } = require("../../../utilities/discord-action-utils");
const { fetchCategory, getGuildOfInteraction, getRequiredStringParam, fetchChannelsOfGuild } = require("../../../utilities/discord-fetch-utils");

const Parameters = {
	Category: new Parameter({
		type: ParameterTypes.STRING,
		name: "category",
		description: "The category with the channels to send the message in",
		isAutocomplete: true,
	}),
}

module.exports = new SlashCommand({
	name: "shuffle-category-channels",
	description: "Shuffles all channels in a category",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Category,
	],

	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const guild = getGuildOfInteraction(interaction);
		const categoryID = getRequiredStringParam(interaction, Parameters.Category.name);
		const category = await fetchCategory(guild, categoryID);

		await shuffleCategoryChannels(guild, category);


		await editReplyToInteraction(interaction,
			`Shuffled channels in **${category.name}**`
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