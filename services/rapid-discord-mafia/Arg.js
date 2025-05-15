class Arg {
	constructor( { name, description, type, subtypes, value="" } ) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.subtypes = subtypes;
		this.value = value;
	}
}

module.exports = Arg;