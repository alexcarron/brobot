const { Duration, Phases } = require("../../modules/enums.js");
const Arg = require("./Arg.js");

/**
 * Enum of possible types of an Ability
 */
const AbilityType = Object.freeze({
	PROTECTION: "protection",
	MANIPULATION: "manipulation",
	ROLEBLOCK: "roleblock",
	MODIFIER: "modifier",
	ATTACKING: "attacking",
	MUTING: "muting",
	INVESTIGATIVE: "investigative",
	CONTROL: "control",
	SUICIDE: "suicide",
	ROLE_CHANGE: "role change",
});

/**
 * Enum of possible priorities of an ability determined by its type
 */
const AbilityPriority = Object.freeze({
	MUTING: 1,
	ROLE_CHANGE: 1,
	MODIFIER: 1,
	ROLEBLOCK: 2,
	CONTROL: 2,
	PROTECTION: 3,
	ATTACKING: 4,
	SUICIDE: 4,
	MANIPULATION: 5,
	INVESTIGATIVE: 6,
});

/**
 * Enum of possible amount of uses an Ability has.
 */
const AbilityUseCount = Object.freeze({
	UNLIMITED: -1,
	NONE: 0,
	AMOUNT: (amount) => {
		if ( !Number.isInteger(amount) || amount <= 0 )
			throw new Error(`Error: Invalid AbilityUseCount.Amount ${amount}. Must be positive non-zero integer.`);
		return amount
	},
});

/**
 * Represents an ability
 */
class Ability {
	/**
	 * The name of the ability
	 * @type {string} AbilityName
	 */
	name;

	/**
	 * The description of what the abiltiy does
	 * @type {string}
	 */
	description;

	/**
	 * The type of ability.
	 * @type {string} AbilityTypes
	 */
	type;

	/**
	 * How much the priority the ability has over other abilities. The higher the number, the later the ability is used
	 * @type {number} AbilityPriority
	 */
	priority;

	/**
	 * The number of times you can use this ability
	 * @type {number} AbilityUseCount
	 */
	uses;

	/**
	 * How many days the ability lasts
	 * @type {number} Duration
	 */
	duration;

	/**
	 * A list of the phases the ability can be used
	 * @type {string[]} Phases[]
	 */
	phases_can_use;

	/**
	 * The names of the effects this ability applies
	 * @type {string[]} EffectName[]
	 */
	effects;

	/**
	 * A function that gets the feedback the player using this ability recieves
	 * @type {() => string}
	 */
	feedback;

	/**
	 * A list of arguments a player must enter when performing the ability
	 * @type {Arg[]}
	 */
	args;

	/**
	 * A function that reverses the effects of the ability
	 * @type {(player: Player, game_manager: GameManager) => Promise<void>}
	 */
	reverseEffects;

	/**
	 *
	 * @param {Duration} OneDay by default
	 */
	constructor({
		name,
		type,
		uses,
		feedback,
		phases_can_use=[Phases.Night],
		description,
		priority,
		duration=0.5,
		args=[],
		effects=[],
		reverseEffects,
	}) {
		this.name = name;
		this.type = type;
		this.priority = priority;
		this.uses = uses;
		this.duration = duration;
		this.phases_can_use = phases_can_use;
		this.description = description;
		this.feedback = feedback;
		this.args = [];
		this.effects = effects;
		this.reverseEffects	= reverseEffects;

		let allArgObjectsAreArgs = true;

		for (let arg of args) {
			if (!(arg instanceof Arg)) {
				allArgObjectsAreArgs = false;
				arg = new Arg(arg);
			}

			this.args.push(arg);
		}

		if (allArgObjectsAreArgs)
			this.args = args;
	}

	toString() {
		let
			ability_msg = "",
			use_count_msg = "",
			command_example_msg = `Command: \`/use ${this.name.toLowerCase().split(" ").join("-")}\``;

		// Set ability use count text
		switch (true) {
			case this.uses == AbilityUseCount.UNLIMITED:
				use_count_msg = `Unlimited Uses`;
				break;

			case this.uses == AbilityUseCount.NONE:
				command_example_msg = ""
				use_count_msg = "Can't be used voluntarily";
				break;

			case this.uses == AbilityUseCount.AMOUNT(1):
				use_count_msg = "1 Use";
				break;

			case this.uses > 1:
				use_count_msg = `${this.uses} Uses`;
				break;
		}

		ability_msg =
			`\n**${this.name.toUpperCase()}** - \`${use_count_msg}\`` + "\n" +
			command_example_msg + "\n" +
			"> " + this.description + "\n";

		return ability_msg;

	}
}

module.exports = {Ability, AbilityUseCount, AbilityType, AbilityPriority};