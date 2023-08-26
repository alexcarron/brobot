const validator = require("../../utilities/validator");

class Host {
	constructor({
		name = "",
		id = "",
	}) {
		this.name = name;
		this.id = id;

		if (!Host.isHost(this)) {
			console.log("\nINVALID HOST:");
			console.log(this);
			throw new Error(`Invalid arguments for Host object.`);
		}
	}

	static isHost(value) {
		return (
			validator.isObject(value) &&
			validator.doesObjectHaveKeys(value, "name", "id") &&
			typeof value.name === 'string' &&
			typeof value.id === 'string'
		)
	}
}

module.exports = Host;