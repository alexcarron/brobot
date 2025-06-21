const { saveObjectToJsonInGitHub } = require("../../utilities/github-json-storage-utils");

/**
 * Publishes a player's name to the namesmith database and saves it to the database.
 *
 * @param {string} playerID - The ID of the player whose name is being published.
 * @param {string} name - The name to be published for the player.
 * @returns {Promise<void>} A promise that resolves once the published name has been saved to the database.
 */
const publishNameInDatabase = async (playerID, name) => {
	if (!global.namesmith.publishedNames)
		global.namesmith.publishedNames = {};

	global.namesmith.publishedNames[playerID] = name;

	await saveObjectToJsonInGitHub(global.namesmith, "namesmith");
}

/**
 * Retrieves a player's published name from the namesmith database.
 *
 * @param {string} playerID - The ID of the player whose name is being retrieved.
 * @returns {string | undefined} The published name of the player, or undefined if the player has no published name.
 */
const getPublishedNameInDatabase = (playerID) => {
	if (!global.namesmith.publishedNames)
		return undefined;

	return global.namesmith.publishedNames[playerID]
};

module.exports = { publishNameInDatabase, getPublishedNameInDatabase };