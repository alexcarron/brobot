/**
 * Enum of possible types of an Arg for an Ability
 */
const AbilityArgType = Object.freeze({
	PLAYER: "player",
});

class Arg {
	constructor( { name, description, type, subtypes, value="" } ) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.subtypes = subtypes;
		this.value = value;
	}
}

module.exports = { Arg, AbilityArgType };