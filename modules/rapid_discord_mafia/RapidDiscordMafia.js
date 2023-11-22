const Contestant = require("./Contestant");

class RapidDiscordMafia {
	constructor() {
		this.contestants = {};
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

		console.log(this);
	}
}

module.exports = RapidDiscordMafia;