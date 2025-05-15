/**
 * Enum of possible names of an Arg for an Ability
 */
const AbilityArgName = Object.freeze({
	PLAYER_KIDNAPPING: "Player Kidnapping",
	PLAYER_KILLING: "Player Killing",
	PLAYER_TRACKING: "Player Tracking",
	PLAYER_WATCHING: "Player Watching",
	PLAYER_ROLEBLOCKING: "Player Roleblocking",
	PLAYER_HEALING: "Player Healing",
	PLAYER_SHOOTING: "Player Shooting",
	PLAYER_FRAMING: "Player Framing",
	PLAYER_EVLUATING: "Player Evaluating",
	PLAYER_INVESTIGATING: "Player Investigating",
	PLAYER_CONSORTING: "Player Consorting",
	PLAYER_KNIFING: "Player Knifing",
	PLAYER_SMITHING_FOR: "Player Smithing For",
	PLAYER_CONTROLLING: "Player Controlling",
	PLAYER_CONTROLLED_INTO: "Player Target Is Controlled Into",
	PLAYER_OBSERVING: "Player Observing",
	PLAYER_REPLACING: "Player Replacing",
});

/**
 * Enum of possible types of an Arg for an Ability
 */
const AbilityArgType = Object.freeze({
	PLAYER: "player",
});

/**
 * Enum of possible subtypes of an Arg for an Ability
 */
const ArgumentSubtype = Object.freeze({
	VISITING: "visiting",
	NOT_SELF: "not yourself",
	NON_MAFIA: "non-mafia",
	CERTAIN_PLAYERS: "certain players",
	NONE: "",
})

class Arg {
	constructor( { name, description, type, subtypes, value="" } ) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.subtypes = subtypes;
		this.value = value;
	}
}

module.exports = { Arg, AbilityArgType, ArgumentSubtype, AbilityArgName };