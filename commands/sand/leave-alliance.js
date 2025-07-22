const ids = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, removePermissionFromChannel } = require("../../utilities/discord-action-utils");
const { fetchGuild, fetchTextChannel } = require("../../utilities/discord-fetch-utils");

module.exports = new SlashCommand({
	name: "leave-alliance",
	description: "Leave the alliance this command is sent in",
	required_roles: [ids.sandSeason3.roles.contestant],
	required_servers: [ids.sandSeason3.guild],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const category = interaction.channel.parent;
		if (!category || category.name.toLowerCase().includes("alliance") === false) {
      await editReplyToInteraction(interaction,
        "This command can only be used in an alliance category"
      );
			return
    }

		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);
		const commandUser = interaction.user;
		const allianceChannel = interaction.channel;

		await removePermissionFromChannel({
			channel: allianceChannel,
      userOrRoleID: commandUser.id,
		});

		allianceChannel.send(`${commandUser} left the alliance`);

		const numPermissions = allianceChannel.permissionOverwrites.cache.size;
		if (numPermissions <= 1) {
			await allianceChannel.send(`This alliance is now empty and is marked for archiving <@276119804182659072>`);
		}

		const logChannel = await fetchTextChannel(sandSeason3Guild, ids.sandSeason3.channels.log);
		logChannel.send(`${commandUser} left ${allianceChannel}`);

		await editReplyToInteraction(interaction,
			`Left ${allianceChannel}`
		);
	},
});