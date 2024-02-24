const { Factions } = require("../enums.js");
const { toTitleCase } = require("../functions.js");

class Role {
	constructor({name, faction, alignment, attack, defense, goal, isUnique = false, immunities = [], abilities = [], notes = ""}) {
		this.name = name;
		this.faction = faction;
		this.alignment = alignment;
		this.attack = attack;
		this.defense = defense;
		this.goal = goal;
		this.isUnique = isUnique;
		this.immunities = immunities;
		this.abilities = abilities
		this.notes = notes;
	}

	toString(isInfoOnly = false) {
		let
			role_info_msg = "",
			abilities_msg = "", // Optional
			immunities_msg = "", // Optional
			special_notes_msg = this.notes ? `\n## Notes\n${this.notes}\n` : ""; // Optional

		// Create abilities message
		if (this.abilities && this.abilities.length > 0) {
			abilities_msg = `\n## Abilities`;

			// Build ability message
			for (let ability of this.abilities) {
				abilities_msg += ability.toString();
			}
		}

		if (this.immunities && this.immunities.length > 0) {
			immunities_msg += "**Immunities**: "
			immunities_msg += this.immunities.map(immunity => toTitleCase(immunity)).join(", ");
		}

		// Create message
		role_info_msg  =
			(isInfoOnly ? `# ${this.name}` : `# Your role is ${this.name}`) + `\n` +
			`**Goal**: ${this.goal}` + `\n` +
			`**Alignment**: ${this.faction} ${this.alignment}\n` +
			`**Attack**: ${this.attack}  **|**  **Defense**: ${this.defense}\n` +
			immunities_msg +
			abilities_msg +
			special_notes_msg;

		return role_info_msg;
	}

	getFaction() {
		if ([Factions.Mafia, Factions.Town].includes(this.faction)) {
			return this.faction;
		}
		else {
			return this.name;
		}
	}
}

module.exports = Role;