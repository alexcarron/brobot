const { getObjectFromGitHubJSON } = require("../functions.js");
const Contestant = require("./Contestant");
const Logger = require("./Logger.js");
const RoleIdentifier = require("./RoleIdentifier.js");
const Game = require("./game.js");
const PlayerManager = require("./PlayerManager.js");
const RoleManager = require("./RoleManager.js");

class RapidDiscordMafia {
	constructor() {
		this.contestants = {};
	}

	static async setUpRapidDiscordMafia(isMockObject = false) {
		global.RoleManager = require("./RoleManager.js");
		global.Game = new Game(
			new PlayerManager({}, isMockObject),
			new Logger(),
			isMockObject
		);
		global.rapid_discord_mafia = new RapidDiscordMafia();

		if (!isMockObject) {
			const rapid_discord_mafia_obj = await getObjectFromGitHubJSON("rapid_discord_mafia");
			global.rapid_discord_mafia.setTo(rapid_discord_mafia_obj);
			console.log("Rapid Discord Mafia Database Downloaded");
		}
	}

	static getEmptyGame(isMockGame=false) {
		return new Game(new PlayerManager, new Logger, isMockGame)
	}

	/**
	 * @param {Game} mock_game
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

		[...new Set(roles_in_game)].forEach(async role_name => {
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