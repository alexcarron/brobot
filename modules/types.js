let enums = require("./enums.js");

let Types = {
	string: {base: "string"},
	boolean: {base: "boolean"},
	faction: {
		base: "string",
		values: Object.values(enums.Factions),
	},

	alignment: {
		base: "string",
		values: Object.values(enums.Alignments),
	},

	level: {
		base: "number",
		subtype: "integer",
		range: [0, 4],
	},

	immunity: {
		base: "string",
		values: Object.values(enums.Immunities),
	},

	ability: {
		base: "object",
		class: "Ability"
	},

	ability_type: {
		base: "string",
		values: Object.values(enums.AbilityTypes),
	},

	ability_uses: {
		base: "number",
		subtype: "integer",
		range: [-1, 10],
	},

	phase: {
		base: "string",
		values: Object.values(enums.Phases),
	},

	priority: {
		base: "number",
		subtype: "integer",
		range: [1, 10],
	},

	duration: {
		base: "number",
		range: [-1, 10],
	},

	ability_arg: {
		base: "object",
		class: "Arg"
	},

	ability_arg_type: {
		base: "string",
		values: Object.values(enums.ArgumentTypes),
	},

	ability_arg_subtype: {
		base: "string",
		values: Object.values(enums.ArgumentSubtypes),
	},

	array: function(item_type) {
		return {
			base: "object",
			subtype: "array",
			item_type: item_type,
		}
	}
}

module.exports = Types;