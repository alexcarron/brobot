import { MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER } from "../constants/name-publishing.constants";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		slotNumber: number,
		tokensSpent: number,
		tokensRemaining: number,
	}>(),

	notAPlayer: null,
	currentNameEmpty: null,
	nameAlreadyPublished: provides<{ name: string }>(),
	atPublishedNameLimit: provides<{ publishedNameLimit: number }>(),
	cannotAffordPublishedName: provides<{
		tokenCost: number,
		tokensOwned: number,
		tokensNeeded: number,
	}>(),
});

/**
 * Publishes a player's current name as a new published name, deducting the token cost of the published name slot it fills.
 * @param options - The publish options.
 * @param options.player - The player publishing their current name.
 * @returns A workflow result describing the outcome.
 * - notAPlayer if the user is not a player.
 * - currentNameEmpty if the player has no current name to publish.
 * - nameAlreadyPublished if the player already published this exact name.
 * - atPublishedNameLimit if the player has reached the published name limit.
 * - cannotAffordPublishedName if the player cannot afford this published name.
 */
export const publishName = (
	{ player }: {
		player: PlayerResolvable,
	}
) => {
	const { playerService, publishedNameService, activityLogService } = getNamesmithServices();

	if (!playerService.isPlayer(player)) {
		return result.failure.notAPlayer();
	}

	const currentName = playerService.getCurrentName(player);
	if (currentName.length === 0) {
		return result.failure.currentNameEmpty();
	}

	if (publishedNameService.isNamePublishedByPlayer(player, currentName)) {
		return result.failure.nameAlreadyPublished({ name: currentName });
	}

	if (publishedNameService.isPlayerAtPublishedNameLimit(player)) {
		return result.failure.atPublishedNameLimit({ publishedNameLimit: MAX_PUBLISHED_NAME_SLOTS_PER_PLAYER });
	}

	const tokenCost = publishedNameService.getCostOfNextPublishedNameForPlayer(player) as number;
	if (!playerService.hasTokens(player, tokenCost)) {
		const tokensOwned = playerService.getTokens(player);

		return result.failure.cannotAffordPublishedName({
			tokenCost,
			tokensOwned,
			tokensNeeded: tokenCost - tokensOwned,
		});
	}

	const { publishedName, tokensSpent } = publishedNameService.publishPaidPublishedNameForPlayer({
		player,
		name: currentName,
	});

	activityLogService.logPublishName({
		playerPublishingName: player,
	});

	return result.success({
		slotNumber: publishedName.slotNumber,
		tokensSpent,
		tokensRemaining: playerService.getTokens(player),
	});
};
