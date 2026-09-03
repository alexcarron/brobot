import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { undoSellCharacters } from "../../workflows/sell-characters.workflow";
import { toNewCurrentTokensSubtext, toDisplayedCharactersInline, toDisplayedTokensInline, toNewCurrentInventorySubtext } from "../../utilities/player-message.utility";

function getSellCharactersConfirmationText(
	{ charactersSold, tokensEarned, newTokenCount }: {
		charactersSold: string,
		tokensEarned: number,
		newTokenCount: number,
	}
): string {
	return joinLines(
		`You sell ${toDisplayedCharactersInline(charactersSold)} for ${toDisplayedTokensInline(tokensEarned)}.`,
		toNewCurrentTokensSubtext(newTokenCount),
	);
}

function getUndoConfirmationText(
	{ charactersSold, newInventory, newTokenCount }: {
		charactersSold: string,
		newInventory: string,
		newTokenCount: number,
	}
): string {
	return joinLines(
		`You undo selling ${toDisplayedCharactersInline(charactersSold)}.`,
		toNewCurrentInventorySubtext(newInventory),
		toNewCurrentTokensSubtext(newTokenCount),
	);
}

export async function sendSellCharactersConfirmation(
	{ interaction, charactersSold, tokensEarned, newTokenCount }: {
		interaction: ChatInputCommandInteraction,
		charactersSold: string,
		tokensEarned: number,
		newTokenCount: number,
	}
) {
	const playerID = interaction.user.id;

	const confirmationMessage = new DiscordButton({
		promptText: getSellCharactersConfirmationText({ charactersSold, tokensEarned, newTokenCount }),
		id: `undo-sell-characters-${playerID}`,
		label: 'Undo',
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onUndoSellCharactersButtonPressed({ buttonInteraction, charactersSold, tokensEarned });
		},
	});

	await replyToInteraction(interaction, confirmationMessage.getMessageContents());
}

async function onUndoSellCharactersButtonPressed(
	{ buttonInteraction, charactersSold, tokensEarned }: {
		buttonInteraction: ButtonInteraction,
		charactersSold: string,
		tokensEarned: number,
	}
) {
	const playerID = buttonInteraction.user.id;
	const result = undoSellCharacters({ player: playerID, charactersSold, tokensEarned });

	if (result.isNotAPlayer())
		return await replyToInteraction(buttonInteraction, 
			`You're not a player, so this can't be undone.`
		);

	if (result.isCannotAffordUndo())
		return await replyToInteraction(buttonInteraction, 
			`You no longer have enough tokens to undo this.`
		);

	const { newInventory, newTokenCount } = result;

	return await replyToInteraction(buttonInteraction,
		getUndoConfirmationText({ charactersSold, newInventory, newTokenCount })
	);
}
