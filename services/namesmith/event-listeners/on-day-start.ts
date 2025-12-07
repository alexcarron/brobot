import { getYesterday } from "../../../utilities/date-time-utils";
import { fetchUser } from "../../../utilities/discord-fetch-utils";
import { joinLines, toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { Perks } from "../constants/perks.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";

/**
 * Triggers any game events that must occur at the start of each day
 */
export async function onDayStart() {
	const { perkService, playerService, activityLogService } = getNamesmithServices();
	await perkService.doForAllPlayersWithPerk(Perks.INVESTMENT,
		async (player) => {
			const tokensInterest = Math.floor(player.tokens / 100) * 2;
			playerService.giveTokens(player, tokensInterest);
			const user = await fetchUser(player.id);
			await user.send(joinLines(
				`Here's your daily interest from the Investment perk!`,
				`+${toAmountOfNoun(tokensInterest, 'token')} ` + '🪙'.repeat(tokensInterest)
			))
		}
	);

	await perkService.doForAllPlayersWithPerk(Perks.HOARDING_BONUS,
		async (player) => {
			const tokensBonus = player.inventory.length;
			playerService.giveTokens(player, tokensBonus);
			const user = await fetchUser(player.id);
			await user.send(joinLines(
				`Here's your daily tokens from the Hoarding Bonus perk! You earn a token for each character in your inventory.`,
				`+${toAmountOfNoun(tokensBonus, 'token')} ` + '🪙'.repeat(tokensBonus)
			))
		}
	);

	await perkService.doForAllPlayersWithPerk(Perks.IDLE_INTEREST,
		async (player) => {
			const tokensSpent = activityLogService.getTokensPlayerSpentSince(
				player, getYesterday()
			);

			if (tokensSpent <= 0) {
				const tokens = 150;
				const user = await fetchUser(player.id);
				await user.send(joinLines(
					`Here's your daily tokens from the Idle Interest perk for not spending any tokens yesterday!`,
					`+${toAmountOfNoun(tokens, 'token')} ` + '🪙'.repeat(tokens)
				))
			}
		}
	)
}