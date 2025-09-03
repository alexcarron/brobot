import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { Character } from "../types/character.types";
import { MysteryBoxResolveable } from "../types/mystery-box.types";
import { PlayerResolvable } from "../types/player.types";
import { NonPlayerBoughtMysteryBoxError, PlayerCantAffordMysteryBoxError } from "../utilities/error.utility";

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param options - The options for opening the mystery box.
 * @param options.mysteryBoxService - The service for opening the mystery box.
 * @param options.playerService - The service for adding a character to the player's name.
 * @param options.player - The player who is opening the mystery box.
 * @param options.mysteryBox - The mystery box to open.
 * @returns A promise that resolves with the character object received from the mystery box.
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
): Promise<{character: Character}> => {
	if (!playerService.isPlayer(player)) {
		throw new NonPlayerBoughtMysteryBoxError(
			playerService.resolveID(player)
		);
	}

	const tokenCost = mysteryBoxService.getCost(mysteryBox);
	if (!playerService.hasTokens(player, tokenCost)) {
		throw new PlayerCantAffordMysteryBoxError(
			mysteryBoxService.resolveMysteryBox(mysteryBox),
			playerService.resolvePlayer(player),
		);
	}

	const recievedCharacter = mysteryBoxService.openBox(mysteryBox);

	const characterValue = recievedCharacter.value;

	await playerService.giveCharacter(player, characterValue);

	return {
		character: recievedCharacter,
	};
};