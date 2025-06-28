const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { getNamesmithServices } = require("../../services/namesmith/services/get-namesmith-services");
const { openMysteryBox } = require("../../services/namesmith/workflows/open-mystery-box.workflow");
const { deferInteraction } = require("../../utilities/discord-action-utils");
const { fetchGuildMember } = require("../../utilities/discord-fetch-utils");


const command = new SlashCommand({
	name: "open-mystery-box",
	description: "Open a mystery box",
});
command.required_servers = [ids.servers.namesmith];
command.required_roles = [
	[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
];
command.required_channels = [ids.namesmith.channels.openMysteryBoxes];
command.isInDevelopment = true;
command.cooldown = 30 * 60; // 30 minutes
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const playerID = interaction.user.id;
	const mysteryBoxID = 1;
	const { character } = await openMysteryBox(playerID, mysteryBoxID);
	const characterValue = character.value;

	await interaction.editReply(`The character in your mystery box is:\n\`\`\`${characterValue}\`\`\``);
}

module.exports = command;