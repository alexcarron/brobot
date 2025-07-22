const Contestant = require("./contestant.js");
const Logger = require("./logger.js");
const { RoleIdentifier } = require("./role-identifier.js");
const RoleManager = require("./role-manager.js");
const DiscordLogger = require("./discord-logger.js");
const ids = require("../../bot-config/discord-ids.js");
const { GameManager } = require("./game-manager.js");
const { fetchRDMGuild, fetchTextChannel } = require("../../utilities/discord-fetch-utils.js");
const { loadObjectFromJsonInGitHub } = require("../../utilities/github-json-storage-utils.js");
const { logSuccess } = require("../../utilities/logging-utils.js");

/**
 * Class representing the rapid discord mafia game
 */
class RapidDiscordMafia {
	constructor() {
		this.contestants = {};
	}

	static async setUpRapidDiscordMafia(isMockObject = false) {
		let logger = new Logger();

		if (!isMockObject) {
			const rdm_guild = await fetchRDMGuild();
			const staff_chnl = await fetchTextChannel(rdm_guild, ids.rapid_discord_mafia.channels.staff);
			logger = new DiscordLogger(staff_chnl);
		}

		global.game_manager = new GameManager(
			{},
			logger,
			isMockObject
		);

		global.rapid_discord_mafia = new RapidDiscordMafia();

		if (!isMockObject) {
			const rapid_discord_mafia_obj = await loadObjectFromJsonInGitHub("rapid_discord_mafia");
			global.rapid_discord_mafia.setTo(rapid_discord_mafia_obj);
			logSuccess("Rapid Discord Mafia Database Downloaded");
		}
	}

	static async getEmptyGame(isMockGame=false) {
		let logger = new Logger();

		if (!isMockGame) {
			const rdm_guild = await fetchRDMGuild();
			const staff_chnl = await fetchTextChannel(rdm_guild, ids.rapid_discord_mafia.channels.staff);
			logger = new DiscordLogger(staff_chnl);
		}

		return new GameManager({}, logger, isMockGame);
	}

	/**
	 * @param {GameManager} mock_game - The game's current instance
	 * @param {string[]} roles_in_game - An array of all role names in the game
	 */
	static async startMockGameWithRoles(mock_game, roles_in_game) {
		roles_in_game.forEach(async role_name => {
			let name = role_name;
			let num_players_with_role = 1;
			let player_name = name;

			while ( mock_game.player_manager.getPlayerNames().includes(player_name) ) {
				num_players_with_role += 1;
				player_name = name + num_players_with_role;
			}

			await mock_game.addPlayerToGame(player_name);
		});

		const role_identifiers = RoleIdentifier.convertIdentifierStrings(roles_in_game);
		await mock_game.start(role_identifiers);

		[...new Set(roles_in_game)].forEach(role_name => {
			const role = RoleManager.roles[role_name];

			const players_with_role = mock_game.player_manager.getPlayerList().filter(player => {
				return player.name.startsWith(role_name)
			});

			players_with_role.forEach(async player => {
				await player.setRole(role);
			});
		});

		await mock_game.giveAllExesTargets();
	}

	getContestantFromPlayer(player) {
		let contestant = this.contestants[player.id];

		if (!contestant) {
			this.contestants[player.id] = new Contestant({});
			contestant = this.contestants[player.id];
		}

		return contestant;
	}

	setTo(object) {
		for (const property in object) {
			if (property === "contestants") {
				this.contestants = {};

				for (const contestant_id in object["contestants"]) {
					const contestant_obj = object["contestants"][contestant_id];
					const contestant = new Contestant(contestant_obj);

					this.contestants[contestant_id] = contestant;
				}
			}
			else {
				this[property] = object[property];
			}
		}
	}
}

module.exports = RapidDiscordMafia;