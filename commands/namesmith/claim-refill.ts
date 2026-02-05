import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { claimRefill } from "../../services/namesmith/workflows/claim-refill.workflow";
import { toUnixTimestamp } from "../../utilities/date-time-utils";
import { getTokensEarnedFeedback, toTokenEmojis } from "../../services/namesmith/utilities/feedback-message.utility";

export const command = new SlashCommand({
	name: "claim-refill",
	description: "Claim your refill of a decent amount of tokens every so often.",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.CLAIM_REFILL],
	execute: function execute(interaction) {
		const refillResult = claimRefill({
			...getNamesmithServices(),
			playerRefilling: interaction.user.id,
		});

		if (refillResult.isNotAPlayer()) {
			return `You're not a player, so you can't claim a refill of tokens.`;
		}
		else if (refillResult.isRefillAlreadyClaimed()) {
			return (
				`You've already claimed your refill!\n` +
				`Don't worry, your next refill is available <t:${toUnixTimestamp(refillResult.nextRefillTime)}:R>`
			);
		}

		const { baseTokensEarned, newTokenCount, nextRefillTime, tokensFromRefillBonus, tokensFromLuckyDoubleTokens } = refillResult;


		const baseTokensLine = getTokensEarnedFeedback(baseTokensEarned);

		const luckyDoubleTokensLine = (tokensFromLuckyDoubleTokens > 0)
			? joinLines(
				'',
				`+${toAmountOfNoun(baseTokensEarned, 'Lucky Double Token')}`,
				toTokenEmojis(tokensFromLuckyDoubleTokens),
			)
			: null;

		const refillBonusLine = (tokensFromRefillBonus > 0)
			? joinLines(
				'',
				`+${toAmountOfNoun(tokensFromRefillBonus, 'Refill Bonus Token')}`,
				toTokenEmojis(tokensFromRefillBonus),
			)
			: null;

		return joinLines(
			baseTokensLine,
			luckyDoubleTokensLine,
			refillBonusLine,
			``,
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
			`-# Claim your next refill of tokens <t:${toUnixTimestamp(nextRefillTime)}:R>`,
		);
	},
});