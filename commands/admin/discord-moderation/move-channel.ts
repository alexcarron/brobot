import { ChannelType, PermissionFlagsBits } from "discord.js";
import { Parameter, ParameterTypes } from "../../../services/command-creation/parameter";
import { SlashCommand } from "../../../services/command-creation/slash-command";
import { deferInteraction, moveChannelToCategory, replyToInteraction } from "../../../utilities/discord-action-utils";
import { fetchCategory, fetchChannelsOfGuild, fetchGuildChannel, getBooleanParamValue, getGuildOfInteraction, getRequiredStringParam, getStringParamValue } from "../../../utilities/discord-fetch-utils";

const NO_CATEGORY_STRING = 'no-category';

const Parameters = {
	CATEGORY_ID: new Parameter({
		type: ParameterTypes.STRING,
		name: "category-channel-id",
		description: "The id of the category you want to move the channel to",
		isAutocomplete: true,
	}),
	CHANNEL_ID: new Parameter({
		type: ParameterTypes.STRING,
		name: "channel-id",
		description: "The channel you want to move",
		isAutocomplete: true,
		isRequired: false,
	}),
	INHERIT_PERMISSIONS: new Parameter({
		type: ParameterTypes.BOOLEAN,
		name: "inherit-permissions",
		description: "Whether to inherit permissions from the category",
		isRequired: false,
	})
}

module.exports = new SlashCommand({
	name: "move-channel",
	description: "Moves a channel to another category",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.CATEGORY_ID,
		Parameters.CHANNEL_ID,
		Parameters.INHERIT_PERMISSIONS,
	],
	execute: async function(interaction) {
		await deferInteraction(interaction);

		if (interaction.channel === null)
			return await replyToInteraction(interaction,
				"This command can only be used in a channel."
			);

		// Delete Channels
		const categoryID = getRequiredStringParam(interaction, Parameters.CATEGORY_ID.name);
		const guild = getGuildOfInteraction(interaction);
		let category = null;
		if (categoryID !== NO_CATEGORY_STRING) {
			category = await fetchCategory(guild, categoryID);
		}

		let channelID = getStringParamValue(interaction, Parameters.CHANNEL_ID.name);
		if (channelID === null) channelID = interaction.channel.id;
		const channel = await fetchGuildChannel(guild, channelID);

		const inheritPermissions =
			getBooleanParamValue(interaction, Parameters.INHERIT_PERMISSIONS.name)
			?? false;

		await moveChannelToCategory(channel, category, inheritPermissions)

		await replyToInteraction(interaction,
			`Moved ${channel.name} to ${category?.name ?? "no category"}.`
		)
	},
	autocomplete: async function(interaction) {
		let autocompleteValues;
		const focusedParameter = interaction.options.getFocused(true);
		if (!focusedParameter) return;
		if (interaction.channel === null) return;

		const enteredValue = focusedParameter.value;
		const guild = getGuildOfInteraction(interaction);
		const allChannels = await fetchChannelsOfGuild(guild);
		const thisChannel = interaction.channel;

		if (focusedParameter.name === Parameters.CATEGORY_ID.name) {
			const allCategories = allChannels.filter(channel => channel.type === ChannelType.GuildCategory);

			autocompleteValues = allCategories
				.map((category) => ({name: category.name, value: category.id}))
				.concat({name: "No Category", value: NO_CATEGORY_STRING})
				.filter(autocompleteEntry =>
					autocompleteEntry.name.toLowerCase().startsWith(enteredValue.toLowerCase())
				);
		}
		else if (focusedParameter.name === Parameters.CHANNEL_ID.name) {
			autocompleteValues = allChannels
				.map((channel) => ({name: channel.name, value: channel.id}))
				.concat({name: "This Channel", value: thisChannel.id})
				.filter(autocompleteEntry =>
					autocompleteEntry.name.toLowerCase().startsWith(enteredValue.toLowerCase())
				);
		}
		else {
			return;
		}

		if (Object.values(autocompleteValues).length <= 0) {
			autocompleteValues = [{name: "There is nothing to choose from", value: "N/A"}];
		}
		else if (Object.values(autocompleteValues).length > 25) {
			autocompleteValues.splice(25);
		}

		await interaction.respond(autocompleteValues);
	}
});