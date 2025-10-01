const { PermissionFlagsBits } = require("discord.js");
const { ids } = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, removePermissionFromChannel } = require("../../utilities/discord-action-utils");
const { fetchCategoriesOfGuild, fetchTextChannelsInCategory, getRequiredUserParam } = require("../../utilities/discord-fetch-utils");
const { Parameter, ParameterTypes } = require("../../services/command-creation/parameter");


const Parameters = {
	Contestant: new Parameter({
		type: ParameterTypes.USER,
		name: "contestant-removing",
		description: "A contestant to be removed from all alliances",
		isRequired: true,
	}),
};

const command = new SlashCommand({
	name: "kill-contestant",
	description: "Remove a contestant from all alliances",
	required_servers: [ids.sandSeason3.guild],
	required_permissions: [PermissionFlagsBits.Administrator],
	parameters: [
		Parameters.Contestant,
	],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const contestantUser = getRequiredUserParam(interaction, Parameters.Contestant.name);

		const sandSeason3Guild = interaction.guild;
		if (sandSeason3Guild === null) {
			await editReplyToInteraction(interaction, "This command can only be used in Sand Season 3.");
			return;
		}

		const allCategoryChannels = await fetchCategoriesOfGuild(sandSeason3Guild);

		const allianceCategories = allCategoryChannels.filter(
			(channel) => {
				return channel.name.toLowerCase().includes('alliance');
			}
		);

		const allAllianceChannels = [];

		for (const category of allianceCategories) {
			const categoryChannels = await fetchTextChannelsInCategory(
				sandSeason3Guild,
				category.id
			);
			allAllianceChannels.push(...categoryChannels);
		}

		for (const allianceChannel of allAllianceChannels) {
			const currentNumPerrmissions = allianceChannel.permissionOverwrites.cache.size;

			await removePermissionFromChannel({
				channel: allianceChannel,
				userOrRoleID: contestantUser.id,
			});

			const newNumPermissions = allianceChannel.permissionOverwrites.cache.size;
			const numNewPermissions = newNumPermissions - currentNumPerrmissions;

			if (numNewPermissions !== 0) {
				await allianceChannel.send(`${contestantUser} was removed from ${allianceChannel}`);
			}

			if (newNumPermissions <= 1) {
				await allianceChannel.send(`This alliance is now empty and is marked for archiving <@276119804182659072>`);
			}
		}

		await editReplyToInteraction(interaction,
			`Removed ${contestantUser} from all alliances`
		);
	},
});


module.exports = command;