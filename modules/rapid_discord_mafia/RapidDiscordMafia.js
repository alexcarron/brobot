const { getObjectFromGitHubJSON } = require("../functions.js");
const Contestant = require("./Contestant");
const Logger = require("./Logger.js");
const Game = require("./game.js");
const Players = require("./players.js");

class RapidDiscordMafia {
	constructor() {
		this.contestants = {};
	}

	static async setUpRapidDiscordMafia(isMockObject = false) {
		global.Roles = require("./roles");
		global.abilities = require("./ability.js").Abilities;
		global.Game = new Game(
			new Players({}, isMockObject),
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
		return new Game(new Players, new Logger, isMockGame)
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