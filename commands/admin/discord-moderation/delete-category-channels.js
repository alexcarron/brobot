const { PermissionFlagsBits, ChannelType } = require("discord.js");
const Parameter = require("../../../services/command-creation/Paramater");
const SlashCommand = require("../../../services/command-creation/slash-command");
const { fetchChannelsInCategory } = require("../../../utilities/discord-fetch-utils");
const { deferInteraction } = require("../../../utilities/discord-action-utils");

const Parameters = {
	CategoryChannelId: new Parameter({
		type: "string",
		name: "category-channel-id",
		description: "The id of the category whose channels you want to delete",
		isAutocomplete: true,
	}),
}

const command = new SlashCommand({
	name: "delete-category-channels",
	description: "Deletes all the channels in a category",
});
command.required_permissions = [PermissionFlagsBits.Administrator];
command.parameters = [
	Parameters.CategoryChannelId,
]
command.execute = async function(interaction) {
	await deferInteraction(interaction);

	// Delete Channels
	const
		category_id = interaction.options.getString(Parameters.CategoryChannelId.name),
		category_chnls = await fetchChannelsInCategory(interaction.guild, category_id);

	await category_chnls.forEach(
		async (channel) => {
			await channel.delete()
				.then(() => {
					console.log(`Deleted ${channel.name}`);
				})
				.catch(console.error);
		}
	);
}
command.autocomplete = async function(interaction) {
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
			console.log({autocomplete_entry})
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

module.exports = command;