import { ChatInputCommandInteraction } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { toCharacterDiscoveredLines, toTokensGainedLines } from "./mining-message-lines";
import { getMiningSessionMessageContentsWithButtons } from "./mining-session-buttons";
import { MiningSessionState } from "./mining-session-state";

/**
 * Builds the message text shown after a player's first mine.
 * @param params - The parameters for the function.
 * @param params.tokensGained - The tokens gained from the first mine.
 * @param params.characterDiscovered - The character discovered from the first mine, if any.
 * @param params.hasMineBonusPerk - Whether the player has the mine bonus perk.
 * @returns The first mine message text.
 */
export function toFirstMineMessageText(
	{ tokensGained, characterDiscovered, hasMineBonusPerk }: {
		tokensGained: number;
		characterDiscovered: string | null;
		hasMineBonusPerk: boolean;
	}
): string {
	return joinLines(
		...toTokensGainedLines({ tokensGained, hasMineBonusPerk }),
		toCharacterDiscoveredLines(characterDiscovered),
	);
}

/**
 * Sends the message for a player's first mine.
 * @param params - The parameters for the function.
 * @param params.interaction - The command interaction that started the mining session.
 * @param params.firstMineResult - The result of the player's first mine.
 * @param params.firstMineResult.tokensGained - The tokens gained from the first mine.
 * @param params.firstMineResult.characterDiscovered - The character discovered from the first mine, if any.
 * @param params.firstMineResult.hasMineBonusPerk - Whether the player has the mine bonus perk.
 * @param params.firstMineResult.collapseChanceNextLayer - The chance of collapse if the player mines a layer deeper.
 * @param params.tipLine - An optional tip line to append to the session message.
 */
export async function sendFirstMineMessage(
	{ interaction, firstMineResult, tipLine }: {
		interaction: ChatInputCommandInteraction;
		firstMineResult: {
			tokensGained: number;
			characterDiscovered: string | null;
			hasMineBonusPerk: boolean;
			collapseChanceNextLayer: number;
		};
		tipLine?: string | null;
	}
): Promise<void> {
	const userID = interaction.user.id;

	const miningSessionState: MiningSessionState = {
		currentLayer: 1,
		tokensMinedThisSession: firstMineResult.tokensGained,
		charactersFoundThisSession: firstMineResult.characterDiscovered ?? '',
		collapseChanceNextLayer: firstMineResult.collapseChanceNextLayer,
	};

	const messageContents = getMiningSessionMessageContentsWithButtons(
		userID,
		miningSessionState,
		joinLines(
			toFirstMineMessageText(firstMineResult), 
			tipLine ?? null
		),
	);

	await replyToInteraction(interaction, messageContents);
}
