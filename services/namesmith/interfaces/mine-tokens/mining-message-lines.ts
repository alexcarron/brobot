import { joinLines, toAmountOfNoun, toReadableNumber } from "../../../../utilities/string-manipulation-utils";
import { MINE_BONUS_BONUS_TOKENS } from "../../constants/perk.constants";
import { getTokensEarnedFeedback, toDisplayedCharactersInline } from "../../utilities/player-message.utility";
import { MiningSessionState } from "./mining-session-state";

export const NOT_A_PLAYER_MINING_FEEDBACK = `You're not a player, so you can't mine tokens.`;
export const NOT_SESSION_OWNER_FEEDBACK = `This isn't your mining session.`;
export const MINE_COLLAPSE_FEEDBACK = `The mine collapsed.`;
export const BONUS_TOKENS_GAINED_TEXT = `+${toAmountOfNoun(MINE_BONUS_BONUS_TOKENS, 'Bonus Token')}`;
export const CHARACTER_DISCOVERED_TEXT = (characterDiscovered: string) =>
	`**Lucky!** You mined a character: ${toDisplayedCharactersInline(characterDiscovered)}`;
export const MINED_TOKENS_COUNT_TEXT = (tokensMinedThisSession: number) =>
	`-# You have mined ${toAmountOfNoun(tokensMinedThisSession, 'token')}`;
export const LAYER_DEPTH_AND_COLLAPSE_CHANCE_TEXT = (
	{ currentLayer, collapseChanceNextLayer }: { currentLayer: number, collapseChanceNextLayer: number }
) => {
	const oddsOfCollapse = Math.ceil(1 / collapseChanceNextLayer);
	return `-# You have reached **layer ${toReadableNumber(currentLayer)}** with a **1 in ${oddsOfCollapse} chance** of collapsing`;
};
export const LOST_ONE_TOKEN_TEXT = `-# You lost **1 token**`;
export const LOST_ALL_TOKENS_TEXT = (tokenLostFromCollapse: number) =>
	`-# You lost all **${toAmountOfNoun(tokenLostFromCollapse, 'token')}**`;
export const LOST_SOME_TOKENS_TEXT = (tokenLostFromCollapse: number) =>
	`-# You lost ${toAmountOfNoun(tokenLostFromCollapse, 'token')}`;
export const KEPT_SOME_TOKENS_TEXT = (tokensKeptAfterCollapse: number) =>
	`-# You only kept **${toAmountOfNoun(tokensKeptAfterCollapse, 'token')}**`;

/**
 * Builds the lines reporting the tokens gained from a single mine, including a bonus line if the player has the mine bonus perk.
 * @param params - The parameters for the function.
 * @param params.tokensGained - The tokens gained from the mine, including any bonus.
 * @param params.hasMineBonusPerk - Whether the player has the mine bonus perk.
 * @returns The lines reporting the tokens gained.
 */
export function toTokensGainedLines(
	{ tokensGained, hasMineBonusPerk }: { tokensGained: number; hasMineBonusPerk: boolean }
): string[] {
	if (!hasMineBonusPerk) {
		return [getTokensEarnedFeedback(tokensGained, { isOneLine: true })];
	}

	const baseTokensGained = tokensGained - MINE_BONUS_BONUS_TOKENS;
	return [
		getTokensEarnedFeedback(baseTokensGained, { isOneLine: true }),
		BONUS_TOKENS_GAINED_TEXT,
	];
}

/**
 * Builds the line reporting a character discovered from a mine, if any.
 * @param characterDiscovered - The character discovered, or null if none was discovered.
 * @returns The line reporting the discovered character, or null if none was discovered.
 */
export function toCharacterDiscoveredLines(characterDiscovered: string | null): string | null {
	if (characterDiscovered === null) return null;
	return joinLines(CHARACTER_DISCOVERED_TEXT(characterDiscovered));
}

function toMinedTokensLine(tokensMinedThisSession: number): string {
	return MINED_TOKENS_COUNT_TEXT(tokensMinedThisSession);
}

function toLayerDepthAndCollapseChanceLine(currentLayer: number, collapseChanceNextLayer: number): string {
	return LAYER_DEPTH_AND_COLLAPSE_CHANCE_TEXT({ currentLayer, collapseChanceNextLayer });
}

/**
 * Builds the message text shown when mining a layer deeper causes the mine to collapse.
 * @param tokenLostFromCollapse - The tokens the player loses from the collapse.
 * @param tokensKeptAfterCollapse - The tokens the player keeps after the collapse.
 * @returns The collapse message text.
 */
export function toCollapseMessageText(tokenLostFromCollapse: number, tokensKeptAfterCollapse: number): string {
	if (tokenLostFromCollapse === 1) {
		return joinLines(
			MINE_COLLAPSE_FEEDBACK,
			LOST_ONE_TOKEN_TEXT,
		);
	}

	if (tokensKeptAfterCollapse <= 0) {
		return joinLines(
			MINE_COLLAPSE_FEEDBACK,
			LOST_ALL_TOKENS_TEXT(tokenLostFromCollapse),
		);
	}

	return joinLines(
		MINE_COLLAPSE_FEEDBACK,
		LOST_SOME_TOKENS_TEXT(tokenLostFromCollapse),
		KEPT_SOME_TOKENS_TEXT(tokensKeptAfterCollapse),
	);
}

/**
 * Builds the lines reporting the current layer depth and the risk of collapse if the player mines a layer deeper.
 * @param state - The current mining session state.
 * @returns The session status lines.
 */
export function toSessionStatusLines(state: MiningSessionState): string[] {
	return [
		toMinedTokensLine(state.tokensMinedThisSession),
		toLayerDepthAndCollapseChanceLine(state.currentLayer, state.collapseChanceNextLayer),
	];
}
