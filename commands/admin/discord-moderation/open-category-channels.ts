import { PermissionFlagsBits } from "discord.js";
import { Parameter, ParameterTypes } from "../../../services/command-creation/parameter";
import { SlashCommand } from "../../../services/command-creation/slash-command";
import { CategoryChannelParameter, autocompleteCategoryChannelParameter, getCategoryChannelFromInteraction } from "../../../services/command-creation/category-channel-parameter";
import { editReplyToInteraction } from "../../../utilities/discord/interaction-reply-utils";
import { openChannel } from "../../../utilities/discord/permission-utils";
import { getGuildOfInteraction } from "../../../utilities/discord/guild-utils";
import { fetchTextChannelsInCategory } from "../../../utilities/discord/category-utils";

const Parameters = {
	Category: CategoryChannelParameter,
	ReadOnly: new Parameter({
		type: ParameterTypes.BOOLEAN,
		name: "read-only",
		description: "Whether the channels should not allow sending messages",
		isRequired: false,
	}),
}

module.exports = new SlashCommand({
	name: "open-category-channels",
	description: "Opens every channel in a category to everyone",
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Category,
		Parameters.ReadOnly,
	],
	execute: async function(interaction, { readOnly }) {
		const guild = getGuildOfInteraction(interaction);
		const categoryChannel = await getCategoryChannelFromInteraction(interaction, guild);
		const isReadOnly = readOnly ?? false;

		const channels = await fetchTextChannelsInCategory(guild, categoryChannel.id);

		for (const channel of channels) {
			await openChannel(channel, {isReadOnly});
		}

		await editReplyToInteraction(interaction,
			`Opened ${channels.length} channels in **${categoryChannel.name}**${isReadOnly ? " in read-only mode" : ""}.`
		);
	},
	autocomplete: autocompleteCategoryChannelParameter,
});
