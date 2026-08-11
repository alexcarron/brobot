import { getYesterday } from "../../../utilities/date-time-utils";
import { dmUser } from "../../../utilities/discord-action-utils";
import { logInfo } from "../../../utilities/logging-utils";
import { toAmountOfNoun } from "../../../utilities/string-manipulation-utils";
import { IDLE_INTEREST_TOKEN_REWARD, INVESTMENT_PERCENTAGE, Perks } from "../constants/perks.constants";
import { sendShownDailyQuestsDisplay } from "../interfaces/quests/daily-quests-display";
import { sendHiddenQuestsMessages } from "../interfaces/quests/hidden-quests-message";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { getTokensEarnedFeedback } from "../utilities/player-message.utility";
import { telemetry } from '../telemetry/telemetry';

/**
 * Triggers any game events that must occur at the start of each day
 */
export async function onDayStart() {
	const { perkService, playerService, activityLogService, questService, dayService } = getNamesmithServices();
	const now = new Date();

	const today = dayService.addNewDay(now);
	questService.assignNewShownDailyQuests(today);
	await sendShownDailyQuestsDisplay();
	await sendHiddenQuestsMessages();

	telemetry.trackQuestsShown(questService.getCurrentShownDailyQuests(), { areHiddenQuests: false });
	telemetry.trackQuestsShown(questService.getHiddenShownDailyQuestsToday(), { areHiddenQuests: true });

	logInfo(`Day ${today.id} started at ${today.timeStarted.toISOString()}.`);
	logInfo(`Daily quests assigned.`);

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