const Types = require("./types.js");

class Arg {
	constructor( { name, type, subtypes, value="" } ) {
		this.name = name;
		this.type = type;
		this.subtypes = subtypes;
		this.value = value;

	}

	static getPropertyTypes() {
		return {
			'name': Types.string,
			'type': Types.ability_arg_type,
			'subTypes': Types.array(Types.ability_arg_subtype),
			'value': Types.string,
		}
	}
}

module.exports = Arg;