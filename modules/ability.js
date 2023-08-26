const Arg = require("./arg.js");
const Types = require("./types.js");

class Ability {
	constructor( { name, type, uses, activation_phase="night", description, priority, duration=0.5, isLimboOnly=false, args=[], perform } ) {
		this.name = name;
		this.type = type;
		this.priority = priority;
		this.uses = uses;
		this.duration = duration;
		this.activation_phase = activation_phase;
		this.description = description;
		this.isLimboOnly = isLimboOnly;
		this.perform = perform;
		this.args = [];
		for (let arg of args) {
			this.args.push( new Arg(arg) )
		}
	}

	static getPropertyTypes() {
		return {
			'name': Types.string,
			'type': Types.ability_type,
			'uses': Types.ability_uses,
			'phase': Types.phase,
			'description': Types.string,
			'priority': Types.priority,
			'duration': Types.duration,
			'isLimboOnly': Types.boolean,
			'perform': Types.string,
			'args': Types.array(Types.ability_arg),
		}
	}
}

module.exports = Ability;