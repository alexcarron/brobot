const { toTitleCase } = require("../../utilities/text-formatting-utils.js");

/**
 * Enum of possible names of a Role
 */
const RoleName = Object.freeze({
	MAFIOSO: "Mafioso",
	GODFATHER: "Godfather",
	FRAMER: "Framer",
	CONSORT: "Consort",
	EXECUTIONER: "Executioner",
	DOCTOR: "Doctor",
	WITCH: "Witch",
	ESCORT: "Escort",
	TOWNIE: "Townie",
	SHERIFF: "Sheriff",
	SURVIVOR: "Survivor",
	FOOL: "Fool",
	ORACLE: "Oracle",
	IMPERSONATOR: "Impersonator",
	KINDAPPER: "Kidnapper",
	VIGILANTE: "Vigilante",
	TRACKER: "Tracker",
	LOOKOUT: "Lookout",
	SERIAL_KILLER: "Serial Killer",
	CONSIGLIERE: "Consigliere",
	BLACKSMITH: "Blacksmith",
})

/**
 * Enum of possible factions
 */
const Faction = Object.freeze({
	MAFIA: "Mafia",
	TOWN: "Town",
	NEUTRAL: "Neutral",
});

/**
 * Enum of possible role alignments
 */
const Alignment = Object.freeze({
	CROWD: "Crowd",
	INVESTIGATIVE: "Investigative",
	PROTECTIVE: "Protective",
	KILLING: "Killing",
	SUPPORT: "Support",
	DECEPTION: "Deception",
	EVIL: "Evil",
	CHAOS: "Chaos",
	BENIGN: "Benign",
	TYRANT: "Tyrant",
	RANDOM: "Random",
});

/**
 * Enum of possible win conditions for a role
 */
const Goal = Object.freeze({
	ELIMINATE_OTHER_FACTIONS: "Eliminate all non-neutral factions outside of your own as well as any Neutral Killing/Tyrant roles.",
	SURVIVE_ELIMINATED_OTHER_FACTIONS: "Survive until the end of the game and eliminate all non-neutral factions outside of your own as well as any different Neutral Killing/Tyrant roles.",
	SURVIVE: "Survive until the end of the game.",
	SURVIVE_UNTIL_TOWN_LOSES: "Survive until the end of the game to see town lose.",
	BE_LYNCHED: "Be successfully lynched.",
	GET_TARGET_LYNCHED: "Get your target successfully lynched.",
	SAVE_PLAYER_WITH_VEST: "Have a player you smithed a vest for be saved from an attack.",
	DO_GOAL_OF_REPLACED_PLAYER: "Replace someone and accomplish their win condition.",
});

/**
 * Enum of possible immunities a role can have
 */
const Immunity = Object.freeze({
	ROLEBLOCK: "roleblock",
	CONTROL: "control",
});

/**
 * Represents a Mafia role
 */
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
		if ([Faction.MAFIA, Faction.TOWN].includes(this.faction)) {
			return this.faction;
		}
		else {
			return this.name;
		}
	}
}

module.exports = { Role, Faction, Goal, Alignment, Immunity, RoleName };