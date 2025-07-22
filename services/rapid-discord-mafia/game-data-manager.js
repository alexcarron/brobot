const PlayerManager = require('./player-manager.js');
const Death = require('./death.js');
const { saveObjectToJsonInGitHub, loadObjectFromJsonInGitHub } = require('../../utilities/github-json-storage-utils.js');

/**
 * A class to handle the game data that persists across mulitple sessions on github
 */
class GameDataManager {
	/**
	 * @param {object} game_manager - The game's current instance
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
			await saveObjectToJsonInGitHub(rdm_game_obj, GameDataManager.JSON_FILE_NAME);
		}
	}

	/**
	 * Loads the currently saved game state in json to the current game instance
	 */
	async loadFromGithub() {
		if (!this.game_manager.isMockGame) {
			const rdm_game_obj = await loadObjectFromJsonInGitHub(GameDataManager.JSON_FILE_NAME);
			this.setGameFromGameObj(rdm_game_obj);
		}
	}
}

module.exports = GameDataManager;