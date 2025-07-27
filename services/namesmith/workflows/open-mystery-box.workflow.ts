import { InvalidArgumentTypeError } from "../../../utilities/error-utils";
import { MysteryBoxService } from "../services/mystery-box.service";
import { PlayerService } from "../services/player.service";
import { Character } from "../types/character.types";
import { MysteryBoxID } from "../types/mystery-box.types";
import { PlayerID } from "../types/player.types";

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param mysteryBoxService - The service for opening the mystery box.
 * @param playerService - The service for adding a character to the player's name.
 * @param playerID - The ID of the player.
 * @param mysteryBoxID - The ID of the mystery box to open.
 * @returns A promise that resolves with the character object received from the mystery box.
 */
export const openMysteryBox = async (
	{ mysteryBoxService, playerService }: {
		mysteryBoxService: MysteryBoxService,
		playerService: PlayerService
	},
	playerID: PlayerID,
	mysteryBoxID: MysteryBoxID = 1
): Promise<{character: Character}> => {
	if (
		typeof mysteryBoxID !== "number" ||
		isNaN(mysteryBoxID) ||
		mysteryBoxID < 1 ||
		!Number.isInteger(mysteryBoxID)
	)
		throw new InvalidArgumentTypeError({
			functionName: "openMysteryBox",
			argumentName: "mysteryBoxID",
			expectedType: "positive integer",
			actualValue: mysteryBoxID
		});

	const recievedCharacter = mysteryBoxService.openBox(mysteryBoxID);

	const characterValue = recievedCharacter.value;

	await playerService.addCharacterToName(playerID, characterValue);

	return {
		character: recievedCharacter,
	};
};