const { InvalidArgumentError } = require("../../../utilities/error-utils");
const MysteryBoxService = require("../services/mysteryBox.service");
const PlayerService = require("../services/player.service");

/**
 * Opens a mystery box and adds a character to the player's name.
 * @param {object} services - An object containing the services to use for opening the mystery box and adding a character to the player's name.
 * @param {MysteryBoxService} services.mysteryBoxService - The service for opening the mystery box.
 * @param {PlayerService} services.playerService - The service for adding a character to the player's name.
 * @param {string} playerID - The ID of the player.
 * @param {number} [mysteryBoxID] - The ID of the mystery box to open.
 * @returns {Promise<{character: {
 * 	id: number,
 * 	value: string,
 * 	rarity: number,
 * 	tags: string[]
 * }}>} A promise that resolves with the character object received from the mystery box.
 */
const openMysteryBox = async (
	{ mysteryBoxService, playerService },
	playerID, mysteryBoxID = 1
) => {
	if (typeof playerID !== "string")
		throw new InvalidArgumentError(`openMysteryBox: playerID must be a string, but got ${playerID}.`);

	if (
		typeof mysteryBoxID !== "number" ||
		isNaN(mysteryBoxID) ||
		mysteryBoxID < 1 ||
		!Number.isInteger(mysteryBoxID)
	)
		throw new InvalidArgumentError(`openMysteryBox: mysteryBoxID must be a positive integer, but got ${mysteryBoxID}.`);

	const recievedCharacter = await mysteryBoxService.openBoxByID(mysteryBoxID);

	const characterValue = recievedCharacter.value;

	await playerService.addCharacterToName(playerID, characterValue);

	return {
		character: recievedCharacter,
	};
};

module.exports = { openMysteryBox };