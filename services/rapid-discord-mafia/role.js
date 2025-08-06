const { toTitleCase } = require("../../utilities/string-manipulation-utils");

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
	/**
	 * The name of the role
	 * @type {string}
	 */
	name = "";

	/**
	 * The faction the role belongs to
	 * @type {string}
	 */
	faction = Faction.NEUTRAL;

	/**
	 * The alignment of the role
	 * @type {string}
	 */
	alignment = Alignment.CROWD;

	/**
	 * The attack level of the role
	 * @type {number}
	 */
	attack = 0;

	/**
	 * The defense level of the role
	 * @type {number}
	 */
	defense = 0;

	/**
	 * The win condition of the role
	 * @type {string}
	 */
	goal = Goal.ELIMINATE_OTHER_FACTIONS;

	/**
	 * Whether or not the role is unique
	 * @type {boolean}
	 */
	isUnique = false;

	/**
	 * The immunities the role has
	 * @type {string[]}
	 */
	immunities = [];

	/**
	 * The abilities the role has
	 * @type {object[]}
	 */
	abilities = [];

	/**
	 * Any special notes about the role
	 * @type {string}
	 */
	notes = "";

	/**
	 * Initializes a new Role instance with the provided parameters.
	 * @param {object} params - The parameters for initializing the role.
	 * @param {string} params.name - The name of the role.
	 * @param {string} params.faction - The faction the role belongs to.
	 * @param {string} params.alignment - The alignment of the role.
	 * @param {number} params.attack - The attack level of the role.
	 * @param {number} params.defense - The defense level of the role.
	 * @param {string} params.goal - The win condition of the role.
	 * @param {boolean} [params.isUnique] - Whether the role is unique.
	 * @param {string[]} [params.immunities] - The immunities the role has.
	 * @param {object[]} [params.abilities] - The abilities the role has.
	 * @param {string} [params.notes] - Any special notes about the role.
	 */
	constructor({name, faction, alignment, attack, defense, goal, isUnique = false, immunities = [], abilities = [], notes = ""}) {
		this.name = name;
		this.faction = faction;
		this.alignment = alignment;
		this.attack = attack;
		this.defense = defense;
		this.goal = goal;
		this.isUnique = isUnique;
		this.immunities = immunities;
		this.abilities = abilities;
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
		// @ts-ignore
		if ([Faction.MAFIA, Faction.TOWN].includes(this.faction)) {
			return this.faction;
		}
		else {
			return this.name;
		}
	}
}

module.exports = { Role, Faction, Goal, Alignment, Immunity, RoleName };