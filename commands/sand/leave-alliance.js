const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, removePermissionFromChannel } = require("../../utilities/discord-action-utils");
const { fetchGuild, fetchChannel, fetchGuildMember } = require("../../utilities/discord-fetch-utils");

module.exports = new SlashCommand({
	name: "leave-alliance",
	description: "Leave the alliance this command is sent in",
	required_roles: [ids.sandSeason3.roles.contestant],
	required_servers: [ids.sandSeason3.guild],
	required_categories: [ids.sandSeason3.categories.alliance],

	/**
	 * @param {CommandInteraction} interaction
	 */
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);
		const commandUser = interaction.user;
		const allianceChannel = interaction.channel;

		await removePermissionFromChannel({
			channel: allianceChannel,
      userOrRoleID: commandUser.id,
		});

		allianceChannel.send(`${commandUser} left the alliance`);

		const logChannel = await fetchChannel(sandSeason3Guild, ids.sandSeason3.channels.log);
		logChannel.send(`${commandUser} left ${allianceChannel}`);

		await editReplyToInteraction(interaction,
			`Left ${allianceChannel}`
		);
	},
});