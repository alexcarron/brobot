const { Faction } = require("./role");

/**
 * Represents a death
 */
class Death {
	/**
	 * The name of the player who has died
	 * @type {string}
	 */
	victim;

	kills;

	/**
	 * Constructs a Death object.
	 * @param {object} options - The options to construct the Death with.
	 * @param {string} options.victim - The name of the player who has died.
	 * @param {{killer_name: string, killer_role: string, flavor_text?: string}[]} [options.kills] - The kills associated with the death.
	 */
	constructor({
		victim,
		kills = [],
	}) {
		this.victim = victim
		this.kills = kills
	}

	/**
	 * Adds a kill to the Death object.
	 * @param {Record<string, any>} killer - The Player who did the killing.
	 * @param {string} [flavor_text] - The flavor text to include with the kill.
	 */
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
			killer_name: Faction.TOWN,
			killer_role: Faction.TOWN
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