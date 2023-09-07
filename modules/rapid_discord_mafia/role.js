const Types = require("./types.js");

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

	static getPropertyTypes() {
		return {
			'name': Types.string,
			'faction': Types.faction,
			'alignment': Types.alignment,
			'attack': Types.level,
			'defense': Types.level,
			'goal': Types.string,
			'isUnique': Types.boolean,
			'immunities': Types.array(Types.immunity),
			'abilities': Types.array(Types.ability),
			'notes': Types.string,
		}
	}
}

module.exports = Role;