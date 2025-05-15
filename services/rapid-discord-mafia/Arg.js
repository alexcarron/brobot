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

module.exports = { Arg, AbilityArgType, ArgumentSubtype };