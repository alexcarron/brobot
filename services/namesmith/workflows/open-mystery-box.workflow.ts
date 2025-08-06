import { InvalidArgumentTypeError } from "../../../utilities/error-utils";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { Character } from "../types/character.types";
import { MysteryBoxID, MysteryBoxResolveable } from "../types/mystery-box.types";
import { PlayerID, PlayerResolvable } from "../types/player.types";

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param mysteryBoxService - The service for opening the mystery box.
 * @param playerService - The service for adding a character to the player's name.
 * @param playerResolvable - The player who is opening the mystery box.
 * @param mysteryBoxResolvable - The mystery box to open.
 * @returns A promise that resolves with the character object received from the mystery box.
 */
export const openMysteryBox = async (
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
	const recievedCharacter = mysteryBoxService.openBox(mysteryBox);

	const characterValue = recievedCharacter.value;

	await playerService.addCharacterToName(player, characterValue);

	return {
		character: recievedCharacter,
	};
};