const { PermissionFlagsBits, ChannelType } = require("discord.js");
const { Parameter } = require("../../../services/command-creation/parameter");
const { SlashCommand } = require("../../../services/command-creation/slash-command");
const { fetchChannelsInCategory, fetchChannel } = require("../../../utilities/discord-fetch-utils");
const { deferInteraction, editReplyToInteraction } = require("../../../utilities/discord-action-utils");
const { logInfo, logError } = require("../../../utilities/logging-utils");

const Parameters = {
	CategoryChannelId: new Parameter({
		type: "string",
		name: "category-channel-id",
		description: "The id of the category whose channels you want to delete",
		isAutocomplete: true,
	}),
}

module.exports = new SlashCommand({
	name: "delete-category-channels",
	description: "Deletes all the channels in a category",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.CategoryChannelId,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		// Delete Channels
		const
			categoryID = interaction.options.getString(Parameters.CategoryChannelId.name),
			categoryChannels = await fetchChannelsInCategory(interaction.guild, categoryID);

		const category = await fetchChannel(interaction.guild, categoryID);
		const numChannels = categoryChannels.length;

		for (const channel of categoryChannels) {
			console.log(channel);
			try {
				await channel.delete();
				logInfo(`Deleted ${channel.name}`);
			}
			catch (error) {
				logError(error);
			}
		}

		await editReplyToInteraction(interaction,
			`Deleted \`${numChannels}\` channels in **${category.name}**`
		)
	},
	autocomplete: async function(interaction) {
		let autocomplete_values;
		const focused_param = await interaction.options.getFocused(true);
		if (!focused_param) return;
		const entered_value = focused_param.value;

		const all_channels = await interaction.guild.channels.fetch();

		const all_categories = await all_channels.filter(channel => channel.type === ChannelType.GuildCategory);

		autocomplete_values = all_categories
			.map((chnl_category) => {
				return {name: chnl_category.name, value: chnl_category.id}
			})
			.filter(autocomplete_entry => {
				return autocomplete_entry.name.toLowerCase().startsWith(entered_value.toLowerCase())
			});

		if (Object.values(autocomplete_values).length <= 0) {
			autocomplete_values = [{name: "Sorry, there are no categories to choose from", value: "N/A"}];
		}
		else if (Object.values(autocomplete_values).length > 25) {
			autocomplete_values.splice(25);
		}

		await interaction.respond(
			autocomplete_values
		);

	}
});