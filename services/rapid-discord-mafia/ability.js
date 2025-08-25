const { Arg } = require("./arg.js");
const { Phase } = require("./game-state-manager.js");

/**
 * Enum of possible names of an Ability
 */
const AbilityName = Object.freeze({
	KNIFE: "Knife",
	MURDER: "Murder",
	SUICIDE: "Suicide",
	SMITH: "Smith",
	SELF_SMITH: "Self Smith",
	KIDNAP: "Kidnap",
	TRACK: "Track",
	LOOKOUT: "Lookout",
	NOTHING: "Nothing",
	DEATH_CURSE: "Death Curse",
	HEAL: "Heal",
	HEAL_SELF: "Heal Self",
	ROLEBLOCK: "Roleblock",
	CAUTIOUS: "Cautious",
	SHOOT: "Shoot",
	FRAME: "Frame",
	SELF_FRAME: "Self Frame",
	FRAME_TARGET: "Frame Target",
	EVALUATE: "Evaluate",
	INVESTIGATE: "Investigate",
	CONSORT: "Consort",
	SELF_VEST: "Self Vest",
	CONTROL: "Control",
	OBSERVE: "Observe",
	REPLACE: "Replace",
});

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
 * Enum of possible durations of an ability
 */
const AbilityDuration = Object.freeze({
	DAY_AND_NIGHT: 1,
	ONE_DAY: 0.5,
	ONE_NIGHT: 0.5,
	INDEFINITE: -1,
});

/**
 * Enum of possible amount of uses an Ability has.
 */
const AbilityUseCount = Object.freeze({
	UNLIMITED: -1,
	NONE: 0,
	/**
	 * Creates an AbilityUseCount with the given amount of uses.
	 * @param {number} amount - The amount of uses. Must be a positive non-zero integer.
	 * @returns {number} The AbilityUseCount with the given amount of uses.
	 * @throws {Error} If the given amount is not a positive non-zero integer.
	 */
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
	 * @type {(...args: any[]) => string}
	 */
	feedback;

	/**
	 * A list of arguments a player must enter when performing the ability
	 * @type {Arg[]}
	 */
	args;

	/**
	 * A function that reverses the effects of the ability
	 * @type {(
	 * 	player: Record<string, any>,
	 * 	game_manager?: Record<string, any>,
	 * ) => Promise<void> | void}
	 */
	reverseEffects;

/**
 * Constructs an instance of Ability with the specified properties.
 * @param {object} options - An object with the following properties:
 * @param {string} options.name - The name of the ability.
 * @param {string} options.type - The type of the ability.
 * @param {number} options.uses - The number of times the ability can be used.
 * @param {(...args: any[]) => string} [options.feedback] - A function that gets the feedback the player using this ability recieves.
 * @param {string[]} [options.phases_can_use] - A list of the phases the ability can be used.
 * @param {string} options.description - A description of the ability.
 * @param {number} options.priority - The priority of the ability.
 * @param {number} [options.duration] - The duration of the ability.
 * @param {Arg[]} [options.args] - A list of arguments a player must enter when performing the ability.
 * @param {string[]} [options.effects] - A list of the effects this ability applies.
 * @param {(
 * 	player: Record<string, any>,
 * 	game_manager?: Record<string, any>
 * ) => Promise<void> | void} [options.reverseEffects] - A function that reverses the effects of the ability
 */

	constructor({
		name,
		type,
		uses,
		feedback = () => "",
		phases_can_use=[Phase.NIGHT],
		description,
		priority,
		duration=0.5,
		args=[],
		effects=[],
		reverseEffects = () => {},
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

module.exports = {Ability, AbilityName, AbilityUseCount, AbilityType, AbilityPriority, AbilityDuration};