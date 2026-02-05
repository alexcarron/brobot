import { getYesterday } from "../../../utilities/date-time-utils";
import { dmUser } from "../../../utilities/discord-action-utils";
import { toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { Perks } from "../constants/perks.constants";
import { IDLE_INTEREST_TOKEN_REWARD, INVESTMENT_PERCENTAGE } from "../constants/quests.constants";
import { sendDailyQuestsMessages } from "../interfaces/quests/daily-quests-message";
import { sendHiddenQuestsMessages } from "../interfaces/quests/hidden-quests-message";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { getTokensEarnedFeedback } from "../utilities/feedback-message.utility";

/**
 * Triggers any game events that must occur at the start of each day
 */
export async function onDayStart() {
	const { perkService, playerService, activityLogService, questService } = getNamesmithServices();
	const now = new Date();

	questService.assignNewDailyQuests(now);
	await sendDailyQuestsMessages();
	await sendHiddenQuestsMessages();

	await perkService.doForAllPlayersWithPerk(Perks.INVESTMENT,
		async (player) => {
			const tokensInterest = Math.floor(player.tokens * INVESTMENT_PERCENTAGE);
			playerService.giveTokens(player, tokensInterest);
			const tokensAfter = playerService.getTokens(player) + tokensInterest;

			await dmUser(player.id,
				`Here's your daily interest from the Investment perk!`,
				getTokensEarnedFeedback(tokensInterest),
				`-# You now have ${toAmountOfNoun(tokensAfter, 'token')}.`
			);
		}
	);

	await perkService.doForAllPlayersWithPerk(Perks.HOARDING_BONUS,
		async (player) => {
			const tokensBonus = player.inventory.length;
			playerService.giveTokens(player, tokensBonus);
			const tokensAfter = playerService.getTokens(player) + tokensBonus;

			await dmUser(player.id,
				`Here's your daily tokens from the Hoarding Bonus perk! You earn a token for each character in your inventory.`,
				getTokensEarnedFeedback(tokensBonus),
				`-# You now have ${toAmountOfNoun(tokensAfter, 'token')}.`
			);
		}
	);

	await perkService.doForAllPlayersWithPerk(Perks.IDLE_INTEREST,
		async (player) => {
			const tokensSpent = activityLogService.getTokensPlayerSpentSince(
				player, getYesterday()
			);

			if (tokensSpent <= 0) {
				const tokens = IDLE_INTEREST_TOKEN_REWARD;
				const tokensAfter = playerService.giveTokens(player, tokens);

				await dmUser(player.id,
					`Here's your daily tokens from the Idle Interest perk for not spending any tokens yesterday!`,
					getTokensEarnedFeedback(tokens),
					`-# You now have ${toAmountOfNoun(tokensAfter, 'token')}.`
				);
			}
		}
	)
}