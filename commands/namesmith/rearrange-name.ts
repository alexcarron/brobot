import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getInputFromCreatedTextModal, addButtonToMessageContents, waitForButtonPressThen, removeComponentsFromInteractionMessage } from "../../utilities/discord-action-utils";
import { getCharacterDifferences } from "../../utilities/data-structure-utils";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { Tips } from "../../services/namesmith/constants/tips.constants";
import { toDisplayedName, toDisplayOrderedCharacters, toTipLine } from "../../services/namesmith/utilities/player-message.utility";
import { joinLines } from "../../utilities/string-manipulation-utils";
import { MessageFlags } from "discord.js";

export const command = new SlashCommand({
	name: "rearrange-name",
	description: "Rearrange the order of the characters you have in your name",
	required_servers: [ids.servers.NAMESMITH],
	required_roles: [
		[ids.namesmith.roles.namesmither, ids.namesmith.roles.noName, ids.namesmith.roles.smithedName],
	],
	disableAutoDefer: true,
	execute: async function execute(interaction) {
		const playerID = interaction.user.id;

		const { playerService, activityLogService, tipService } = getNamesmithServices();
		const currentName = playerService.getCurrentName(playerID);
		const inventory = playerService.getInventory(playerID);

		const initialInput = await getInputFromCreatedTextModal({
			interaction,
			modalTitle: `Rearrange The Characters In Your Name`,
			placeholder: currentName,
		});

		if (initialInput === undefined) return;

		let correctlyRearrangedName = false;
		let newName = initialInput;

		while (!correctlyRearrangedName) {
			const { extraCharacters } = getCharacterDifferences(inventory, newName);

			if (extraCharacters.length === 0) {
				correctlyRearrangedName = true;
				break;
			}

			let message = "";

			if (extraCharacters.length > 0) {
				message += `\nYou added the following characters which you don't have in your inventory:\n> ${toDisplayOrderedCharacters(extraCharacters)}`;
			}

			const initialMessageText =
				message +
				"\n\nClick the button to try to rearrange the characters in your name again.";

			const messageContents = addButtonToMessageContents({
				contents: {
					content: initialMessageText,
					flags: MessageFlags.Ephemeral,
				},
				buttonID: "rearrange-name",
				buttonLabel: "Rearrange Name",
			});

			const messageWithButton = await interaction.followUp(messageContents);

			await waitForButtonPressThen(messageWithButton, "rearrange-name", async (buttonInteraction) => {
				const retryInput = await getInputFromCreatedTextModal({
					interaction: buttonInteraction,
					modalTitle: `Rearrange The Characters In Your Name`,
					placeholder: currentName,
				});

				if (retryInput !== undefined) newName = retryInput;
			});

			await removeComponentsFromInteractionMessage(interaction, messageWithButton);
		}

		const nameBefore = playerService.getCurrentName(playerID);
		playerService.changeCurrentName(playerID, newName);
		activityLogService.logChangeName({
			playerChangingName: playerID,
			nameBefore,
		});

		const unusedCharacters = playerService.getUnusedInventoryCharacters(playerID, newName);

		let successMessage = `Good work. Your name is now ${toDisplayedName(newName)}.`;
		if (unusedCharacters.length > 0) {
			successMessage += `\nYou still have the following unused characters in your inventory:\n> ${toDisplayOrderedCharacters(unusedCharacters)}`;
		}

		const tipMessage = tipService.getAndViewTipIfPlayerShouldSeeIt(playerID, Tips.HOW_TO_PUBLISH_NAME.key);
		const tipLine = toTipLine(tipMessage);

		if (interaction.isRepliable()) {
			await interaction.followUp({
				content: joinLines(
					successMessage, 
					tipLine
				),
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});