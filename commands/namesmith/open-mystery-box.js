const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { getRandomElement } = require("../../utilities/data-structure-utils");
const { deferInteraction } = require("../../utilities/discord-action-utils");

const CHARACTER_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

const command = new SlashCommand({
	name: "open-mystery-box",
	description: "Open a mystery box",
});
command.required_servers = [ids.servers.namesmith];
command.required_roles = [ids.namesmith.roles.namesmither];
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const recievedCharacter = getRandomElement(CHARACTER_SET);

	await interaction.editReply(`The character you recieved is:\n\`${recievedCharacter}\``);
}

module.exports = command;