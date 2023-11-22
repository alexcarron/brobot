const Contestant = require("./Contestant");

class RapidDiscordMafia {
	constructor() {
		this.contestants = {};
	}

	getContestantFromPlayer(player) {
		return this.contestants[player.id]
	}

	setTo(object) {
		for (const property in game) {
			if (property === "contestants") {
				this.contestants = {};

				for (const contestant_id of object["contestants"]) {
					const contestant_obj = object["contestants"][contestant_id];
					const contestant = new Contestant(contestant_obj);

					object["contestants"][contestant_id] = contestant;
				}
			}
			else {
				this[property] = object[property];
			}
		}
	}
}

module.exports = RapidDiscordMafia;