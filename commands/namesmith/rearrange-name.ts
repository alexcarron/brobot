import ids from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getInputFromCreatedTextModal, addButtonToMessageContents, doWhenButtonPressed } from "../../utilities/discord-action-utils";
import { getCharacterDifferencesInStrings } from "../../utilities/data-structure-utils";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";

export const command = new SlashCommand({
	name: "rearrange-name",
	description: "Rearrange the order of the characters you have in your name",
	required_servers: [ids.servers.namesmith],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	execute: async function execute(interaction) {
		const playerID = interaction.user.id;

		const { playerService } = getNamesmithServices();
		const currentName = await playerService.getCurrentName(playerID);
		const inventory = await playerService.getInventory(playerID);

		let correctlyRearrangedName = false;
		let initialMessageText = "Click the button to rearrange the characters in your name";
		let newName = await getInputFromCreatedTextModal({
			interaction,
			modalTitle: `Rearrange The Characters In Your Name`,
			placeholder: currentName,
		}) || "";

		while (!correctlyRearrangedName) {
			const { extraCharacters } = getCharacterDifferencesInStrings(inventory, newName);

			if (extraCharacters.length === 0) {
				correctlyRearrangedName = true;
				break;
			}

			let message = "";
			// if (missingCharacters.length > 0) {
			// 	message += `You're missing the following characters in your name: ${missingCharacters.map(char => `\`${char}\``).join(', ')}!`;
			// }

			if (extraCharacters.length > 0) {
				message += `\nYou added the following characters which you don't have in your inventory: ${extraCharacters.map(char => `\`${char}\``).join(', ')}!`;
			}

			initialMessageText =
				message +
				"\n\nClick the button to try to rearrange the characters in your name again";

				const contents = {
					content: initialMessageText,
					ephemeral: true
				}

				const messageContents = addButtonToMessageContents({
					contents,
					buttonID: "rearrange-name",
					buttonLabel: "Rearrange Name",
				})

			const messageWithButton = await interaction.followUp(messageContents);

			await doWhenButtonPressed(messageWithButton, "rearrange-name", async (buttonInteraction) => {
				newName = await getInputFromCreatedTextModal({
					interaction: buttonInteraction,
					modalTitle: `Rearrange The Characters In Your Name`,
					placeholder: currentName,
				}) || "";
			});
		}

		await playerService.changeCurrentName(playerID, newName);
	}
});