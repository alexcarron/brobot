import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { Character } from "../types/character.types";
import { MysteryBox, MysteryBoxResolveable } from '../types/mystery-box.types';
import { Player, PlayerResolvable } from "../types/player.types";
import { getWorkflowResultCreator, provides } from "./workflow-result-creator";

const result = getWorkflowResultCreator({
	success: provides<{
		player: Player,
		mysteryBox: MysteryBox,
		tokenCost: number,
		recievedCharacter: Character,
	}>(),

	nonPlayerBoughtMysteryBox: null,

	mysteryBoxDoesNotExist: null,

	playerCantAffordMysteryBox: provides<{
		mysteryBoxName: string,
		tokensNeeded: number,
		tokensOwned: number
	}>(),
})

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param options - The options for opening the mystery box.
 * @param options.mysteryBoxService - The service for opening the mystery box.
 * @param options.playerService - The service for adding a character to the player's name.
 * @param options.player - The player who is opening the mystery box.
 * @param options.mysteryBox - The mystery box to open.
 * @returns A promise that resolves with the character object received from the mystery box.
 * - NonPlayerBoughtMysteryBoxError if the player is not a player.
 * - PlayerCantAffordMysteryBoxError if the player does not have enough tokens to buy the mystery box.
 */
export const buyMysteryBox = async (
	{
		mysteryBoxService, playerService,
		player,
		mysteryBox = 1
	}: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService,
		player: PlayerResolvable,
		mysteryBox?: MysteryBoxResolveable
	}
) => {
	if (!playerService.isPlayer(player)) {
		return result.failure.nonPlayerBoughtMysteryBox();
	}

	if (!mysteryBoxService.isMysteryBox(mysteryBox)) {
		return result.failure.mysteryBoxDoesNotExist();
	}

	const tokenCost = mysteryBoxService.getCost(mysteryBox);
	if (!playerService.hasTokens(player, tokenCost)) {
		mysteryBox = mysteryBoxService.resolveMysteryBox(mysteryBox);
		player = playerService.resolvePlayer(player);

		return result.failure.playerCantAffordMysteryBox({
			mysteryBoxName: mysteryBox.name,
			tokensNeeded: tokenCost - player.tokens,
			tokensOwned: player.tokens
		});
	}

	playerService.takeTokens(player, tokenCost);

	const recievedCharacter = mysteryBoxService.openBox(mysteryBox);
	const characterValue = recievedCharacter.value;

	await playerService.giveCharacter(player, characterValue);

	return result.success({
		player: playerService.resolvePlayer(player),
		mysteryBox: mysteryBoxService.resolveMysteryBox(mysteryBox),
		tokenCost,
		recievedCharacter,
	});
};