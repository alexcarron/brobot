const axios = require('axios');
const { github_token } =  require("../../modules/token.js");
const PlayerManager = require('./PlayerManager.js');

/**
 * A class to handle the game data that persists across mulitple sessions on github
 */
class GameDataManager {
	/**
	 * @param {Game} game_manager - The game's current instance
	 */
	constructor(game_manager) {
		this.game_manager = game_manager;
	}

	static REPO_OWNER = "alexcarron";
	static REPO_NAME = "brobot-database";
	static JSON_FILE_NAME = "rdm-game.json";


	getSimpleCopyOfGame() {
		const game_obj_copy = { ...this.game_manager };

		game_obj_copy.players = game_obj_copy.player_manager.players;

		delete game_obj_copy.player_manager;
		delete game_obj_copy.logger;
		delete game_obj_copy.effect_manager;
		delete game_obj_copy.ability_manager;
		delete game_obj_copy.role_manager;
		delete game_obj_copy.data_manager;
		delete game_obj_copy.state_manager;
		delete game_obj_copy.vote_manager;
		delete game_obj_copy.discord_service;

		return game_obj_copy;
	}

	async setGameFromGameObj(game_obj) {
		console.log({game_obj});

		for (const property in game_obj) {
			if (property === "next_deaths") {
				this.game_manager.next_deaths = [];
				const deaths = game_obj[property];
				for (const death of deaths) {
					this.game_manager.next_deaths.push(new Death(death));
				}
			}
			else if (property !== "Players") {
				this.game_manager[property] = game_obj[property];
			}

		}

		this.game_manager.player_manager = new PlayerManager({}, this.game_manager, this.game_manager.logger, this.game_manager.isMockGame);

		for (const player_obj of Object.values(game_obj.players)) {
			await this.game_manager.player_manager.addPlayerFromObj(player_obj);
		}
	}

	/**
	 * Saves the current game state to a json file in github to be loaded in case the bot crashes or stops
	 */
	async saveToGithub() {
		if (!this.game_manager.isMockGame) {
			const rdm_game_obj = this.getSimpleCopyOfGame();
			const rdm_game_str = JSON.stringify(rdm_game_obj);

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
		if (!this.game_manager.isMockGame) {

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
			let rdm_game_obj = JSON.parse(rdm_game_str);

			this.setGameFromGameObj(rdm_game_obj);
		}
	}
}

module.exports = GameDataManager;