/**
 * An effect applied to a player using an ability or having an ability used on them
 */
class Effect {
	/**
	 * The name of the effect.
	 * @type {string}
	 */
	name;

	/**
	 * The function that applies the effect.
	 * @type {(player_using_ability: Player, ability: Ability, arg_values: {[arg_name: string]: [arg_value: string]},) => void}
	 */
	applyEffect;

	/**
	 * An effect applied to a player using an ability or having an ability used on them.
	 * @param {Object} effect
	 * @param {string} effect.name - The name of the effect.
	 * @param {Ability} effect.from_ability - The ability that caused the effect.
	 * @param {(player_using_ability: Player, ability: Ability, arg_values: {[arg_name: string]: [arg_value: string]},) => void} effect.applyEffect - The function that applies the effect.
	 */
	constructor({
		name,
		applyEffect,
	}) {
		this.name = name;
		this.applyEffect = applyEffect;
	}
}

module.exports = Effect;