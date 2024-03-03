const { Logger } = require("winston");
const Effect = require("./Effect");
const { RoleNames, AbilityName, AbilityArgName } = require("../enums");

/**
 * Used to handle ability effects and apply them
 */
class EffectManager {
	/**
	 * @param {Game} game
	 * @param {Logger} logger
	 */
	constructor(game, logger) {
		this.game = game;
		this.logger = logger;
	}

	static EffectName = {
		Roleblock: "Roleblock",
		Cautious: "Cautious",
		Heal: "Heal",
		SelfHeal: "Self Heal",
		Order: "Order",
		Attack: "Attack",
		Frame: "Frame",
		SelfFrame: "Self Frame",
	}

	/**
	 * @type {{[effect_name: string]: Effect}}
	 */
	static effects = {
		[this.EffectName.Roleblock]: new Effect({
			name: this.EffectName.Roleblock,
			applyEffect: function(player_using_ability, ability, arg_values) {
				const
					roleblocked_player_name = player_using_ability.visiting,
					roleblocked_player = this.game.Players.get(roleblocked_player_name),
					roleblocked_player_role = global.Roles[ roleblocked_player.role ];

				if (
					!(
						roleblocked_player_role.immunities &&
						roleblocked_player_role.immunities.includes(Immunities.Roleblock)
					)
				) {
					roleblocked_player.isRoleblocked = true;
					roleblocked_player.addFeedback(Feedback.WasRoleblocked);
				}
				else {
					roleblocked_player.addFeedback(Feedback.WasRoleblockedButImmune);
				}

				if (
					roleblocked_player_role.name === RoleNames.SerialKiller &&
					!roleblocked_player.affected_by.some(affect => affect.name === AbilityName.Cautious)
				) {
					console.log(`${RoleNames.SerialKiller} ${roleblocked_player_name} stabs ${player_using_ability.name} as revenge for roleblocking them`);

					this.game.abilities_performed[roleblocked_player_name] =
						{
							"name": AbilityName.Knife,
							"by": roleblocked_player_name,
							"args": [player_using_ability.name]
						}

					roleblocked_player.visiting = player_using_ability.name;
					roleblocked_player.addFeedback(Feedback.AttackedRoleblocker);
				}

				player_using_ability.addFeedback(Feedback.RoleblockedPlayer(roleblocked_player));

				roleblocked_player.addAbilityAffectedBy(player_using_ability, ability.name);
			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {
				player_using_ability.addFeedback(Feedback.DidCautious);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name);
			}
		}),

		[this.EffectName.Heal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: function(player_using_ability, ability, arg_values) {
				const
					player_healing_name = player_using_ability.visiting,
					player_healing = this.game.Players.get(player_healing_name);

				player_healing.giveDefenseLevel(2);

				player_healing.addAbilityAffectedBy(player_using_ability, ability.name);
			}
		}),

		[this.EffectName.SelfHeal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: function(player_using_ability, ability, arg_values) {
				player_using_ability.giveDefenseLevel(2);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name);
			}
		}),

		[this.EffectName.Order]: new Effect({
			name: this.EffectName.Order,
			applyEffect: function(player_using_ability, ability, arg_values) {
				const
					player_killing_name = arg_values[AbilityArgName.PlayerKilling],
					mafioso_player = this.game.Players.getPlayerWithRole(RoleNames.Mafioso);

				if (mafioso_player) {
					mafioso_player.visiting = player_killing_name;
					this.game.abilities_performed[mafioso_player.name] =
						{
							"name": AbilityName.Murder,
							"by": mafioso_player.name,
							"args": [player_killing_name]
						}

					mafioso_player.addFeedback(Feedback.OrderedByGodfather(player_killing_name));
				}
				else {
					player_using_ability.visiting = player_killing_name;
					this.game.abilities_performed[player_using_ability.name] =
						{
							"name": AbilityName.Murder,
							"by": player_using_ability.name,
							"args": [player_killing_name]
						}

					player_using_ability.addFeedback(Feedback.KillForMafioso(player_killing_name));
				}

			}
		}),

		[this.EffectName.Attack]: new Effect({
			name: this.EffectName.Attack,
			applyEffect: function(player_using_ability, ability, arg_values) {
				const
					attacked_player_name = player_using_ability.visiting,
					attacked_player = this.game.Players.get(attacked_player_name);

				attacked_player.receiveAttackFrom(player_using_ability);

				attacked_player.addAbilityAffectedBy(player_using_ability, ability.name)
			}
		}),

		[this.EffectName.Frame]: new Effect({
			name: this.EffectName.Frame,
			applyEffect: function(player_using_ability, ability, arg_values) {
				const
					framed_player_name = player_using_ability.visiting,
					framed_player = this.game.Players.get(framed_player_name);

				framed_player.frame();

				framed_player.addAbilityAffectedBy(player_using_ability, ability.name);
			}
		}),

		[this.EffectName.SelfFrame]: new Effect({
			name: this.EffectName.SelfFrame,
			applyEffect: function(player_using_ability, ability, arg_values) {
				player_using_ability.frame();

				player_using_ability.addAbilityAffectedBy(player_using_ability, ability_performed.name);

			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {

			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {

			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {

			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {

			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(player_using_ability, ability, arg_values) {

			}
		}),

	}

	/**
	 * Get an effect object from an effect name
	 * @param {EffectManager.EffectName} effect_name
	 * @returns {Effect | undefined} undefined if effect name doesn't exist
	 */
	getEffect(effect_name) {
		return EffectManager.effects[effect_name];
	}

	/**
	 *
	 * @param {Object} parameters
	 * @param {EffectManager.EffectName} parameters.effect_name - The name of the effect.
	 * @param {Player} parameters.player_using_ability - The player using the ability which causes this effect
	 * @param {Ability} parameters.ability - The ability which causes this effect
	 * @param {{[arg_name: string]: [arg_value: string]}} parameters.arg_values - The argument names and values passed by the player for the ability which causes this effect
	 */
	useEffect({effect_name, player_using_ability, ability, arg_values={}}) {
		const effect = this.getEffect(effect_name);

		if (effect !== undefined) {
			effect.applyEffect(player_using_ability, ability, arg_values)
		}
	}
}

module.exports = EffectManager;