import { getNamesmithServices } from "../../services/get-namesmith-services";
import { Player, PlayerResolvable } from "../../types/player.types";
import { Quest, QuestResolvable } from "../../types/quest.types";
import { getWorkflowResultCreator, provides } from "../workflow-result-creator";
import { Quests } from '../../constants/quests.constants';
import { FREEBIE_QUEST_NAME } from '../../constants/test.constants';
import { hasEmoji, hasSymbol, hasLetter } from '../../../../utilities/string-checks-utils';

const PLAYER_MET_CRITERIA = 'questSuccess' as const;
const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		quest: Quest,
	}>(),
	notAPlayer: null,
	questDoesNotExist: null,
	alreadyCompletedQuest: null,
	questCriteriaNotDefined: provides<{questName: string}>(),

	notEnoughCrafts: provides<{
		numHas: number,
		numNeeded: number
	}>(),
	notEnoughUniqueRecipes: provides<{
		numHas: number,
		numNeeded: number
	}>(),

	nameNotPublished: null,
	nameHasNoEmojis: null,
	nameHasNoSymbols: null,
	nameHasNoLetters: null,

	notEnoughTradesMade: provides<{
		numHas: number,
		numNeeded: number
	}>(),
	notEnoughUniquePlayersAccepted: provides<{
		numHas: number,
		numNeeded: number
	}>(),

	nameNotSharedByAnyone: null,
	nameTooShort: provides<{
		currentLength: number,
		lengthNeeded: number
	}>(),

	notEnoughTokensEarned: provides<{
		numHas: number,
		numNeeded: number
	}>(),
});

const questIDToMeetsCriteriaCheck = {
	[Quests.EXPERIENCED_CRAFTSMAN.id]: (player: Player) => {
		const { activityLogService } = getNamesmithServices();
		const craftLogs = activityLogService.getCraftLogsForPlayer(player);
		const uniqueRecipesCrafted = new Set<number>();

		for (const log of craftLogs) {
			if (!log.involvedRecipe) continue;
			uniqueRecipesCrafted.add(log.involvedRecipe.id);
		}

		if (craftLogs.length < 5)
			return result.failure.notEnoughCrafts({
				numHas: craftLogs.length,
				numNeeded: 5
			});

		if (uniqueRecipesCrafted.size < 3)
			return result.failure.notEnoughUniqueRecipes({
				numHas: uniqueRecipesCrafted.size,
				numNeeded: 3
			});

		return PLAYER_MET_CRITERIA;
	},

	[Quests.DIVERSE_NAME.id]: (player: Player) => {
		const publishedName = player.publishedName;

		if (publishedName === null)
			return result.failure.nameNotPublished();
		else if (!hasEmoji(publishedName))
			return result.failure.nameHasNoEmojis();
		else if (!hasSymbol(publishedName))
			return result.failure.nameHasNoSymbols();
		else if (!hasLetter(publishedName))
			return result.failure.nameHasNoLetters();

		return PLAYER_MET_CRITERIA;
	},

	[Quests.TRADE_DIPLOMAT.id]: (player: Player) => {
		const { activityLogService } = getNamesmithServices();
		const tradeAcceptedLogs = activityLogService.getAcceptTradeLogsInvolvingPlayer(player);

		const uniqueInvolvedPlayers = new Set<string>();
		for (const log of tradeAcceptedLogs) {
			if (!log.player) continue;
			uniqueInvolvedPlayers.add(log.player.id);
		}

		if (tradeAcceptedLogs.length < 3)
			return result.failure.notEnoughTradesMade({
				numHas: tradeAcceptedLogs.length,
				numNeeded: 3
			});

		if (uniqueInvolvedPlayers.size < 3)
			return result.failure.notEnoughUniquePlayersAccepted({
				numHas: uniqueInvolvedPlayers.size,
				numNeeded: 3
			});

		return PLAYER_MET_CRITERIA;
	},

	[Quests.TWINSIES.id]: (player: Player) => {
		const { playerService } = getNamesmithServices();
		if (player.publishedName === null)
			return result.failure.nameNotPublished();

		const allPublishedNames = playerService.getAllPublishedNames();

		const numSamePublishedNames =
			allPublishedNames.filter(publishedName =>
				publishedName !== null &&
				publishedName === player.publishedName
			).length;

		if (numSamePublishedNames < 2)
			return result.failure.nameNotSharedByAnyone();

		if (player.publishedName.length <= 6)
			return result.failure.nameTooShort({
				currentLength: player.publishedName.length,
				lengthNeeded: 6
			});

		return PLAYER_MET_CRITERIA;
	},

	[Quests.GET_RICH_QUICK.id]: (player: Player) => {
		const { activityLogService } = getNamesmithServices();
		const logs = activityLogService.getLogsForPlayer(player);

		let totalTokenGain = 0;
		for (const log of logs) {
			if (log.tokensDifference > 0)
				totalTokenGain += log.tokensDifference;
		}

		if (totalTokenGain < 1000)
			return result.failure.notEnoughTokensEarned({
				numHas: totalTokenGain,
				numNeeded: 1000
			});

		return PLAYER_MET_CRITERIA;
	}
} as const;


/**
 * Completes a quest for a player.
 * @param parameters - An object containing the following parameters:
 * @param parameters.playerResolvable - The player completing the quest.
 * @param parameters.questResolvable - The quest being completed.
 * @returns A result indicating if the quest was successfully completed or not.
 */
export function completeQuest(
	{playerResolvable, questResolvable}: {
		playerResolvable: PlayerResolvable,
		questResolvable: QuestResolvable,
	}
) {
	const {playerService, questService, activityLogService} = getNamesmithServices();

	if (!playerService.isPlayer(playerResolvable)) {
		return result.failure.notAPlayer();
	}

	if (!questService.isQuest(questResolvable)) {
		return result.failure.questDoesNotExist();
	}

	if (activityLogService.hasPlayerAlreadyCompletedQuest(playerResolvable, questResolvable)) {
		return result.failure.alreadyCompletedQuest();
	}

	const quest = questService.resolveQuest(questResolvable);
	const player = playerService.resolvePlayer(playerResolvable);
	if (quest.id in questIDToMeetsCriteriaCheck) {
		const questID = quest.id as keyof typeof questIDToMeetsCriteriaCheck;
		const meetsCriteriaResult = questIDToMeetsCriteriaCheck[questID](player);
		if (meetsCriteriaResult !== PLAYER_MET_CRITERIA)
			return meetsCriteriaResult;
	}
	else {
		if (!quest.name.includes(FREEBIE_QUEST_NAME))
			return result.failure.questCriteriaNotDefined({questName: quest.name});
	}

	const nameBefore = player.currentName;
	questService.givePlayerRewards(playerResolvable, questResolvable);

	activityLogService.logCompleteQuest({
		playerCompletingQuest: playerResolvable,
		questCompleted: questResolvable,
		tokensRewarded: quest.tokensReward,
		charactersRewarded: quest.charactersReward,
		nameBefore,
	});

	return result.success({
		player: playerService.resolvePlayer(playerResolvable),
		quest: questService.resolveQuest(questResolvable),
	});
}