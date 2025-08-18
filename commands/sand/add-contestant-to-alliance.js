const { PermissionFlagsBits } = require("discord.js");
const { ids } = require("../../bot-config/discord-ids");
const { Parameter, ParameterType } = require("../../services/command-creation/parameter");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { deferInteraction, addPermissionToChannel, editReplyToInteraction, memberHasRole } = require("../../utilities/discord-action-utils");
const { fetchGuild, fetchGuildMember, fetchTextChannel, getCategoryOfInteraction, getRequiredUserParam, getTextChannelOfInteraction } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	Contestant: new Parameter({
		type: ParameterType.USER,
		name: "contestant",
		description: "The contesant to add to the alliance this command is sent in",
		isRequired: true,
	}),
}

module.exports = new SlashCommand({
	name: "add-contestant-to-alliance",
	description: "Add a contestant to the alliance this command is sent in",
	required_roles: [ids.sandSeason3.roles.contestant],
	required_servers: [ids.sandSeason3.guild],
	parameters: [
		Parameters.Contestant,
	],
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const category = getCategoryOfInteraction(interaction);

		if (!category || category.name.toLowerCase().includes("alliance") === false) {
      await editReplyToInteraction(interaction,
        "This command can only be used in an alliance category"
      );
			return
    }

		const sandSeason3Guild = await fetchGuild(ids.sandSeason3.guild);
		const commandUser = interaction.user;
		const allianceChannel = getTextChannelOfInteraction(interaction);
		const contestantAdded = getRequiredUserParam(interaction, Parameters.Contestant.name);

		const contestantMember = await fetchGuildMember(sandSeason3Guild, contestantAdded.id);
		if (
			!(await memberHasRole(contestantMember, ids.sandSeason3.roles.contestant, true))
		) {
			await editReplyToInteraction(interaction,
        `User <@${contestantAdded.id}> is not a valid contestant. Please provide a valid contestant.`
      );
      return;
    }

		// Permission Overwites includes everyone permission
		if (allianceChannel.permissionOverwrites.cache.size >= 6) {
			await editReplyToInteraction(interaction,
        `The alliance channel is already full! You cannot have more than 5 contestants in the alliance.`
      );
      return;
    }

		await addPermissionToChannel({
			channel: allianceChannel,
      userOrRoleID: contestantAdded.id,
      allowedPermissions: [PermissionFlagsBits.ViewChannel],
		});

		allianceChannel.send(`${commandUser} added ${contestantAdded} to the alliance`);

		const logChannel = await fetchTextChannel(sandSeason3Guild, ids.sandSeason3.channels.log);
		logChannel.send(`${commandUser} added ${contestantAdded} to ${allianceChannel}`);

		await editReplyToInteraction(interaction,
			`Added ${contestantAdded} to ${allianceChannel}`
		);
	},
});