const axios = require('axios');
const { github_token } =  require("../token.js");

/**
 * A class to handle the game data that persists across mulitple sessions on github
 */
class GameDataManager {
	/**
	 * @param {Game} game - The game's current instance
	 */
	constructor(game) {
		this.game = game;
	}

	static REPO_OWNER = "alexcarron";
	static REPO_NAME = "brobot-database";
	static JSON_FILE_NAME = "rdm-game.json";


	/**
	 * Saves the current game state to a json file in github to be loaded in case the bot crashes or stops
	 */
	async saveToGithub() {
		if (!this.game.isMockGame) {
			const rdm_game_str = JSON.stringify(this.game);

			try {
				// Get the current file data
				const {data: file} =
					await axios.get(
						`https://api.github.com/repos/${GameDataManager.REPO_OWNER}/${GameDataManager.REPO_NAME}/contents/${GameDataManager.JSON_FILE_NAME}`,
						{
							headers: {
								'Authorization': `Token ${github_token}`
							}
						}
					);

				// Update the file content
				await axios.put(
					`https://api.github.com/repos/${GameDataManager.REPO_OWNER}/${GameDataManager.REPO_NAME}/contents/${GameDataManager.JSON_FILE_NAME}`,
					{
						message: 'Update file',
						content: new Buffer.from(rdm_game_str).toString(`base64`),
						sha: file.sha
					},
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);
			} catch (error) {
				console.error(error);
			}
		}
	}

	/**
	 * Loads the currently saved game state in json to the current game instance
	 */
	async loadFromGithub() {
		if (!this.game.isMockGame) {

			// Get the current file data
			const {data: file} =
				await axios.get(
					`https://api.github.com/repos/${GameDataManager.REPO_OWNER}/${GameDataManager.REPO_NAME}/contents/${GameDataManager.JSON_FILE_NAME}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				)
				.catch(err => {
					console.error(err);
				});


			let rdm_game_str = Buffer.from(file.content, 'base64').toString();
			let rdm_game = JSON.parse(rdm_game_str);

			this.game.setGame(rdm_game);
		}
	}
}

module.exports = GameDataManager;