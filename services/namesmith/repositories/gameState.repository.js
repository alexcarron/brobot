const { saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub } = require("../../../utilities/github-json-storage-utils");

/**
 * Provides access to the game state data.
 */
class GameStateRepository {
	static REPO_NAME = "namesmith-game-state";
	gameState = {};

	async load() {
		this.gameState = await loadObjectFromJsonInGitHub(GameStateRepository.REPO_NAME);

		// Convert timestamps to Date objects
		if (
			this.gameState.timeStarted &&
			typeof this.gameState.timeStarted === "number"
		)
			this.gameState.timeStarted = new Date(this.gameState.timeStarted);

		if (
			this.gameState.timeEnding &&
			typeof this.gameState.timeEnding === "number"
		)
			this.gameState.timeEnding = new Date(this.gameState.timeEnding);
	}

	async save() {
		const gameStateClone = { ...this.gameState };
		// Convert Date objects to timestamps
		if (
			gameStateClone.timeStarted &&
			gameStateClone.timeStarted instanceof Date
		)
			gameStateClone.timeStarted = gameStateClone.timeStarted.getTime();

		if (
			gameStateClone.timeEnding &&
			gameStateClone.timeEnding instanceof Date
		)
			gameStateClone.timeEnding = gameStateClone.timeEnding.getTime();

		await saveObjectToJsonInGitHub(gameStateClone, GameStateRepository.REPO_NAME);
	}

	/**
	 * Returns the current game state.
	 * @returns {Promise<{
	 * 	timeStarted: Date,
	 * 	timeEnding: Date
	 * }>} The current game state.
	 */
	async getGameState() {
		await this.load();
		return this.gameState;
	}

	/**
	 * Retrieves the time when the game started.
	 * @returns {Promise<Date>} The time when the game started.
	 */
	async getTimeStarted() {
		const gameState = await this.getGameState();
		return gameState.timeStarted;
	}

	/**
	 * Sets the time when the game started.
	 * @param {Date} timeStarted The time when the game started.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setTimeStarted(timeStarted) {
		this.gameState.timeStarted = timeStarted;
		await this.save();
	}

	/**
	 * Retrieves the time when the game is expected to end.
	 * @returns {Promise<Date>} The time when the game is expected to end.
	 */
	async getTimeEnding() {
		const gameState = await this.getGameState();
		return gameState.timeEnding;
	}

	/**
	 * Sets the time when the game is expected to end.
	 * @param {Date} timeEnding - The time when the game is expected to end.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setTimeEnding(timeEnding) {
		this.gameState.timeEnding = timeEnding;
		await this.save();
	}
}

module.exports = GameStateRepository;