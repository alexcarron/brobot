const ids = require("../../bot-config/discord-ids");
const { SlashCommand } = require("../../services/command-creation/slash-command");
const { getNamesmithServices } = require("../../services/namesmith/services/get-namesmith-services");
const { openMysteryBox } = require("../../services/namesmith/workflows/open-mystery-box.workflow");
const { deferInteraction } = require("../../utilities/discord-action-utils");

module.exports = new SlashCommand({
	name: "open-mystery-box",
	description: "Open a mystery box",
	required_servers: [ids.servers.namesmith],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	required_channels: [ids.namesmith.channels.openMysteryBoxes],
	cooldown: 5,
	execute: async function execute(interaction) {
		await deferInteraction(interaction);

		const playerID = interaction.user.id;
		const mysteryBoxID = 1;
		const { mysteryBoxService, playerService } = getNamesmithServices();
		const { character } = await openMysteryBox(
			{ mysteryBoxService, playerService },
			playerID, mysteryBoxID
		);
		const characterValue = character.value;

		await interaction.editReply(`The character in your mystery box is:\n\`\`\`${characterValue}\`\`\``);
	}
});