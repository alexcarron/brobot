import { ids } from "../../../bot-config/discord-ids";
import { toAmountOfNoun, toListOfWords } from "../../../utilities/string-manipulation-utils";
import { getCharacters, hasLetter, hasNumber, hasSpace } from "../../../utilities/string-checks-utils";
import { Rank, Ranks } from "../types/vote.types";

/**
 * Returns the mentions that ping every player in the game, whether or not they have smithed a name yet.
 * This is a function rather than a constant because the role IDs are resolved from the current environment each time they are read.
 * @returns The mentions to include in a message that should ping every player.
 */
export function getPingForAllPlayers(): string {
	return `<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`;
}

/**
 * Builds the hint line pointing a player to every channel where they can currently earn more tokens.
 * @param options - Whether the player has unlocked hidden quests, since #hidden-quests is only visible to players who've unlocked it and shouldn't be hinted at otherwise.
 * @param options.hasHiddenQuestsUnlocked - Whether the player has unlocked hidden quests.
 * @returns The hint line to append to messages telling a player they don't have enough tokens.
 */
export function getHowToEarnMoreTokensHint({ hasHiddenQuestsUnlocked }: { hasHiddenQuestsUnlocked: boolean }): string {
	const channelIDs = [
		ids.namesmith.channels.MINE_TOKENS,
		ids.namesmith.channels.CLAIM_REFILL,
		ids.namesmith.channels.DAILY_QUESTS,
		ids.namesmith.channels.WEEKLY_QUESTS,
	];

	if (hasHiddenQuestsUnlocked) {
		channelIDs.push(ids.namesmith.channels.HIDDEN_QUESTS);
	}

	const channelMentions = channelIDs.map(channelID => `<#${channelID}>`);

	return `-# ${toListOfWords(channelMentions)} to get more`;
}

export function getTokensEarnedFeedback(
	numTokensEarned: number,
	options: {
		isOneLine?: boolean
	} = {},
): string {
	const isOneLine = options?.isOneLine ?? false;
	
	if (numTokensEarned <= 0) 
		return '**+0 Tokens**';

	const lines = [
		`**+${toAmountOfNoun(numTokensEarned, 'Token')}**`,
		toTokenEmojis(numTokensEarned)
	]
	
	if (isOneLine) {
		return lines.join(' ');
	}
	else {
		return lines.join('\n');
	}
}

export function toTokenEmojis(numTokens: number) {
	const MAX_TOKEN_EMOJIS = 500;
	const MAX_MONEY_BAG_EMOJIS = 250;
	const numTokenEmojis = Math.min(numTokens, MAX_TOKEN_EMOJIS);
	const leftoverTokens = numTokens - numTokenEmojis;
	const numMoneyBagEmojis = Math.min(leftoverTokens / 10, MAX_MONEY_BAG_EMOJIS);
	
	return `${'💰'.repeat(numMoneyBagEmojis)}${'🪙'.repeat(numTokenEmojis)}`;
}

/**
 * Formats a list of characters for display in a message as individual backtick-wrapped code spans.
 * @param characters - The characters to format, either as a string or an array of characters.
 * @param separator - The string used to join the formatted characters.
 * @returns The characters formatted as backtick-wrapped code spans, joined by the given separator.
 */
export function toBacktickedCharacterList(
	characters: string | string[],
	separator: string = ', '
): string {
	const characterList = typeof characters === 'string' ? getCharacters(characters) : characters;

	return characterList
		.map(character => character.replace('`', '\\`'))
		.map(character => `\`${character}\``)
		.join(separator);
}

/**
 * Joins an ordered list of characters into a single display string, wrapping each consecutive run of whitespace characters in a single backtick code span so it remains visible instead of blending into normal spacing.
 * Each run gets its own code span rather than each character getting its own, since adjacent single-character code spans containing only whitespace don't render reliably in Discord.
 * @param characterList - The characters to join, in the order they should be displayed.
 * @returns The characters joined into a single display string.
 */
function toWhitespaceVisibleCharacters(characterList: string[]): string {
	const runs: { isWhitespace: boolean, characters: string[] }[] = [];

	for (const character of characterList) {
		const isWhitespace = hasSpace(character);
		const lastRun = runs[runs.length - 1];

		if (lastRun !== undefined && lastRun.isWhitespace === isWhitespace) {
			lastRun.characters.push(character);
		}
		else {
			runs.push({ isWhitespace, characters: [character] });
		}
	}

	return runs
		.map(run => {
			const runText = run.characters.join("");
			return run.isWhitespace ? `\`${runText}\`` : runText;
		})
		.join("");
}

/**
 * Sorts a set of characters into the order they should be displayed in: letters first, then numbers, then spaces, then everything else alphabetically.
 * Returns plain character data with no markdown added - use this (not `toDisplayOrderedCharacters`) when the result will be processed further (e.g. diffed against another character list) rather than sent directly as message text, since `toDisplayOrderedCharacters` embeds backtick code spans in its output.
 * @param characters - The characters to sort, either as a string or an array of characters.
 * @returns The characters in display order.
 */
export function sortCharactersForDisplay(characters: string | string[]): string[] {
	const characterList = typeof characters === 'string' ? getCharacters(characters) : characters;

	return characterList.slice().sort((char1, char2) => {
		// Letters come first
		if (hasLetter(char1) && !hasLetter(char2)) return -1;
		if (!hasLetter(char1) && hasLetter(char2)) return 1;

		// Numbers come second
		if (hasNumber(char1) && !hasNumber(char2)) return -1;
		if (!hasNumber(char1) && hasNumber(char2)) return 1;

		// Spaces come third
		if (hasSpace(char1) && !hasSpace(char2)) return -1;
		if (!hasSpace(char1) && hasSpace(char2)) return 1;

		// Otherwise, sort alphabetically
		return char1.localeCompare(char2);
	});
}

/**
 * Sorts a set of characters into display order (see `sortCharactersForDisplay`) and joins them into a single display string, wrapping whitespace runs in backticks so they remain visible.
 * @param characters - The characters to sort, either as a string or an array of characters.
 * @returns The characters in display order, joined into a single string.
 */
export function toDisplayOrderedCharacters(characters: string | string[]): string {
	return toWhitespaceVisibleCharacters(sortCharactersForDisplay(characters));
}

const NO_NAME_PLACEHOLDER = '*[No name]*';

/**
 * Formats a player's name for inline display in a message.
 * @param name - The name to format for display.
 * @returns The displayed name
 */
export function toDisplayedName(name: string): string {
	if (name.length === 0) {
		return NO_NAME_PLACEHOLDER;
	}

	return `**${name.replace(/\*/g, '\\*')}**`;
}

export function toRankEmoji(rank: Rank): string {
	switch (rank) {
		case Ranks.FIRST: return '🥇';
		case Ranks.SECOND: return '🥈';
		case Ranks.THIRD: return '🥉';
	}
}