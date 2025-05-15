const { Faction } = require("./Role");

class Death {
	/**
	 * The name of the player who has died
	 * @type {string}
	 */
	victim;
	kills;

	constructor({
		victim,
		kills = [],
	}) {
		this.victim = victim
		this.kills = kills
	}

	addKill(killer, flavor_text) {
		const kill = {}
		kill.killer_name = killer.name;
		kill.killer_role = killer.getPercievedRole();

		if (flavor_text)
			kill.flavor_text = flavor_text

		this.kills.push(kill)
	}

	setToLynch() {
		const kill = {
			killer_name: Faction.TOWN
		}

		this.kills.push(kill);
	}

	isLynch() {
		return this.kills.some(kill =>
			kill.killer_name === Faction.TOWN
		)
	}
}

module.exports = Death;