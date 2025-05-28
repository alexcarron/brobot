const ids = require("../../bot-config/discord-ids");
const { ParameterType, Parameter } = require("../../services/command-creation/parameter");
const SlashCommand = require("../../services/command-creation/slash-command");
const { deferInteraction, editReplyToInteraction, removePermissionFromChannel, renameChannel } = require("../../utilities/discord-action-utils");
const { fetchGuild, fetchChannel, fetchGuildMember, getStringParamValue } = require("../../utilities/discord-fetch-utils");

const Parameters = {
	Name: new Parameter({
		type: ParameterType.STRING,
		name: "name",
		description: "The new name of the alliance",
		isRequired: true,
	})
}

module.exports = new SlashCommand({
	name: "rename-alliance",
	description: "Reanme the alliance this command is sent in",
	required_roles: [ids.sandSeason3.roles.contestant],
	required_servers: [ids.sandSeason3.guild],
	required_categories: [ids.sandSeason3.categories.alliance],
	parameters: [
		Parameters.Name,
	],

	/**
	 * @param {CommandInteraction} interaction
	 */
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const commandUser = interaction.user;
		const newName = getStringParamValue(interaction, Parameters.Name.name);
		const allianceChannel = interaction.channel;
		const oldName = allianceChannel.name;
		await renameChannel(allianceChannel, newName);

		allianceChannel.send(`${commandUser} renamed the alliance to **${newName}**`);

		await editReplyToInteraction(interaction,
			`Renamed **${oldName}** to **${newName}**`
		);
	},
});