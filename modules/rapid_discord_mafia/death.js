const { Factions } = require("../enums");

class Death {
	victim;
	kills;

	constructor({
		victim,
		kills = [],
	}) {
		this.victim = victim
		this.kills = kills
	}

	addKill({killer_name, flavor_text}) {
		const kill = {}
		kill.killer_name = killer_name;

		if (flavor_text)
			kill.flavor_text = flavor_text

		this.kills.push(kill)
	}

	setToLynch() {
		const kill = {
			killer_name: Factions.Town
		}

		this.kills.push(kill);
	}
}

module.exports = Death;