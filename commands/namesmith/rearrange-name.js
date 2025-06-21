const { ChatInputCommandInteraction } = require("discord.js");
const ids = require("../../bot-config/discord-ids");
const SlashCommand = require("../../services/command-creation/slash-command");
const { fetchPlayerName, getPublishedNameOfPlayer, publishNameOfPlayer, changeNameOfPlayer } = require("../../services/namesmith/namesmith-utilities");
const { confirmInteractionWithButtons, deferInteraction, editReplyToInteraction, getInputFromCreatedTextModal } = require("../../utilities/discord-action-utils");
const { getCharacterDifferencesInStrings } = require("../../utilities/data-structure-utils");

const command = new SlashCommand({
	name: "rearrange-name",
	description: "Rearrange the order of the characters you have in your name",
});
command.required_servers = [ids.servers.namesmith];
command.required_roles = [
	[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
];
command.isInDevelopment = true;

/**
 * The function that is called when the command is run
 * @param {ChatInputCommandInteraction} interaction The interaction that triggered this command
 * @returns {Promise<void>}
 */
command.execute = async function execute(interaction) {
	await deferInteraction(interaction);

	const playerID = interaction.user.id;

	const currentName = await fetchPlayerName(playerID);

	let correctlyRearrangedName = false;
	let initialMessageText = "Click the button to rearrange the characters in your name";
	let newName = currentName;

	while (!correctlyRearrangedName) {
		newName = await getInputFromCreatedTextModal({
			interaction,
			channelToSendIn: interaction.channel,
			modalTitle: `Rearrange The Characters In Your Name`,
			initialMessageText: initialMessageText,
			showModalButtonText: `Rearrange Name`,
			placeholder: currentName,
		});

		const { missingCharacters, extraCharacters } = getCharacterDifferencesInStrings(currentName, newName);

		if (missingCharacters.length === 0 && extraCharacters.length === 0) {
			correctlyRearrangedName = true;
			break;
		}

		let message = "";
		if (missingCharacters.length > 0) {
			message += `You're missing the following characters in your name: ${missingCharacters.map(char => `\`${char}\``).join(', ')}!`;
		}

		if (extraCharacters.length > 0) {
			message += `\nYou added the following characters which you don't have in your name: ${extraCharacters.map(char => `\`${char}\``).join(', ')}!`;
		}

		initialMessageText =
			message +
			"\n\nClick the button to try to rearrange the characters in your name again";
	}

	const didConfirmAction = await confirmInteractionWithButtons({
		interaction,
		message:
			`Are you sure you want to change your name to: \`${newName}\`?`,
		confirmText: "Yes, Change My Name",
		cancelText: "No, Don't Change My Name",
		confirmUpdateText: `You just changed your current name to \`${currentName}\``,
		cancelUpdateText: "Canceled",
	});

	if (!didConfirmAction)
		return;

	await changeNameOfPlayer(playerID, newName);
}

module.exports = command;