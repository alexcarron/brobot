import { toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { Rank, Ranks } from "../types/vote.types";

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

export function toRankEmoji(rank: Rank): string {
	switch (rank) {
		case Ranks.FIRST: return '🥇';
		case Ranks.SECOND: return '🥈';
		case Ranks.THIRD: return '🥉';
	}
}