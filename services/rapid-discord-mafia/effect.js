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
	 * @type {(
	 * 	game?: object,
	 * 	player_using_ability?: object,
	 * 	ability?: object,
	 * 	arg_values?: {[arg_name: string]: string}
	 * ) => Promise<void> | void}
	 */
	applyEffect;

	/**
	 * An effect applied to a player using an ability or having an ability used on them.
	 * @param {object} options - The options for the effect.
	 * @param {string} options.name - The name of the effect.
	 * @param {(
	 * 	game?: object,
	 * 	player_using_ability?: object,
	 * 	ability?: object,
	 * 	arg_values?: {[arg_name: string]: string}
	 * ) => Promise<void> | void} options.applyEffect - The function that applies the effect.
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