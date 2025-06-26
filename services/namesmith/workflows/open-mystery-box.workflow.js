const { getNamesmithServices } = require("../services/get-namesmith-services");

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param {string} playerID - The ID of the player.
 * @param {number} [mysteryBoxID=1] - The ID of the mystery box to open.
 * @returns {Promise<{character: {
 * 	id: number,
 * 	value: string,
 * 	rarity: number,
 * 	tags: string[]
 * }}>} A promise that resolves with the character object received from the mystery box.
 */
const openMysteryBox = async (playerID, mysteryBoxID = 1) => {
	const { mysteryBoxService, playerService } = getNamesmithServices();

	const recievedCharacter = await mysteryBoxService.openBoxByID(mysteryBoxID);

	const characterValue = recievedCharacter.value;

	playerService.addCharacterToName(playerID, characterValue);

	return {
		character: recievedCharacter,
	};
};

module.exports = { openMysteryBox };