import { ids } from "../../bot-config/discord-ids";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { joinLines, toAmountOfNoun } from "../../utilities/string-manipulation-utils";
import { claimRefill } from "../../services/namesmith/workflows/claim-refill.workflow";
import { toUnixTimestamp } from "../../utilities/date-time-utils";

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

		if (refillResult.isNonPlayerRefilled()) {
			return `You're not a player, so you can't claim a refill of tokens.`;
		}
		else if (refillResult.isRefillAlreadyClaimed()) {
			return (
				`You've already claimed your refill!\n` +
				`Don't worry, your next refill is available <t:${toUnixTimestamp(refillResult.nextRefillTime)}:R>`
			);
		}

		const { baseTokensEarned, newTokenCount, nextRefillTime, tokensFromRefillBonus, } = refillResult;


		const baseTokensLine = joinLines(
			`**+${toAmountOfNoun(baseTokensEarned, 'Token')}**`,
			`${'🪙'.repeat(baseTokensEarned)}`,
		)

		const refillBonusLine = (tokensFromRefillBonus > 0)
			? joinLines(
				'',
				`+${toAmountOfNoun(tokensFromRefillBonus, 'Refill Bonus Token')}`,
				`${'🪙'.repeat(tokensFromRefillBonus)}`,
			)
			: null;

		return joinLines(
			baseTokensLine,
			refillBonusLine,
			``,
			`-# You now have ${toAmountOfNoun(newTokenCount, 'token')}`,
			`-# Claim your next refill of tokens <t:${toUnixTimestamp(nextRefillTime)}:R>`,
		);
	},
});