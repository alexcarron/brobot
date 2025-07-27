const Effect = require("./effect");
const { AbilityUseCount, AbilityName } = require("./ability");
const { Faction, Alignment, Immunity, RoleName } = require("./role");
const { AbilityArgType, ArgumentSubtype, AbilityArgName } = require("./arg");
const { Feedback } = require("./constants/possible-messages");

/**
 * Used to handle ability effects and apply them
 */
class EffectManager {
	/**
	 * @param {object} game - Current game instnace
	 */
	constructor(game) {
		this.game = game;
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
		FrameTarget: "Frame Target",
		Evaluate: "Evaluate",
		Track: "Track",
		Lookout: "Lookout",
		Investigate: "Investigate",
		Smith: "Smith",
		SelfSmith: "Self Smith",
		Control: "Control",
		Observe: "Observe",
		Replace: "Replace",
		Kidnap: "Kidnap",
	}

	/**
	 * @type {{[effect_name: string]: Effect}}
	 */
	static effects = {
		[this.EffectName.Roleblock]: new Effect({
			name: this.EffectName.Roleblock,
			applyEffect: function(game, player_using_ability, ability) {
				const
					roleblocked_player_name = player_using_ability.visiting,
					roleblocked_player = game.player_manager.get(roleblocked_player_name),
					roleblocked_player_role = game.role_manager.getRole(roleblocked_player.role);

				if (
					!(
						roleblocked_player_role.immunities &&
						roleblocked_player_role.immunities.includes(Immunity.ROLEBLOCK)
					)
				) {
					roleblocked_player.isRoleblocked = true;
					roleblocked_player.addFeedback(Feedback.WAS_ROLEBLOCKED);
				}
				else {
					roleblocked_player.addFeedback(Feedback.WAS_ROLEBLOCKED_BUT_IMMUNE);
				}

				if (
					roleblocked_player_role.name === RoleName.SERIAL_KILLER &&
					!roleblocked_player.affected_by.some(
						affect => affect.name === AbilityName.CAUTIOUS
					)
				) {
					game.logger.log(`${RoleName.SERIAL_KILLER} ${roleblocked_player_name} stabs ${player_using_ability.name} as revenge for roleblocking them`);

					game.abilities_performed[roleblocked_player_name] =
						{
							"name": AbilityName.KNIFE,
							"by": roleblocked_player_name,
							"args": [player_using_ability.name]
						}

					roleblocked_player.visiting = player_using_ability.name;
					roleblocked_player.addFeedback(Feedback.ATTACKED_ROLEBLOCKER);
				}

				player_using_ability.addFeedback(Feedback.ROLEBLOCKED_PLAYER(roleblocked_player));

				roleblocked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: function(game, player_using_ability, ability) {
				player_using_ability.addFeedback(Feedback.DID_CAUTIOUS);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Heal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: function(game, player_using_ability, ability,) {
				const
					player_healing_name = player_using_ability.visiting,
					player_healing = game.player_manager.get(player_healing_name);

				player_healing.giveDefenseLevel(2);

				player_healing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfHeal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: function(game, player_using_ability, ability) {
				player_using_ability.giveDefenseLevel(2);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		// [this.EffectName.Order]: new Effect({
		// 	name: this.EffectName.Order,
		// 	applyEffect: async function(game, player_using_ability, ability, arg_values) {
		// 		const
		// 			player_killing_name = arg_values[AbilityArgName.PlayerKilling],
		// 			mafioso_player = game.player_manager.getPlayerWithRole(RoleNames.Mafioso);

		// 		if (mafioso_player) {
		// 			mafioso_player.visiting = player_killing_name;
		// 			game.abilities_performed[mafioso_player.name] =
		// 				{
		// 					"name": AbilityName.Murder,
		// 					"by": mafioso_player.name,
		// 					"args": [player_killing_name]
		// 				}

		// 			mafioso_player.addFeedback(Feedback.OrderedByGodfather(player_killing_name));
		// 		}
		// 		else {
		// 			player_using_ability.visiting = player_killing_name;
		// 			game.abilities_performed[player_using_ability.name] =
		// 				{
		// 					"name": AbilityName.Murder,
		// 					"by": player_using_ability.name,
		// 					"args": [player_killing_name]
		// 				}

		// 			player_using_ability.addFeedback(Feedback.KillForMafioso(player_killing_name));
		// 		}

		// 	}
		// }),

		[this.EffectName.Attack]: new Effect({
			name: this.EffectName.Attack,
			applyEffect: function(game, player_using_ability, ability) {
				const
					attacked_player_name = player_using_ability.visiting,
					attacked_player = game.player_manager.get(attacked_player_name);

				game.player_manager.attackPlayer({
					attacker_player: player_using_ability,
					target_player: attacked_player,
				});

				attacked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5)
			}
		}),

		[this.EffectName.Frame]: new Effect({
			name: this.EffectName.Frame,
			applyEffect: function(game, player_using_ability, ability) {
				const
					framed_player_name = player_using_ability.visiting,
					framed_player = game.player_manager.get(framed_player_name);

				framed_player.frame();

				framed_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfFrame]: new Effect({
			name: this.EffectName.SelfFrame,
			applyEffect: function(game, player_using_ability, ability) {
				player_using_ability.frame();

				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.FrameTarget]: new Effect({
			name: this.EffectName.FrameTarget,
			applyEffect: function(game, player_using_ability, ability) {
				const
					exe_target_name = player_using_ability.exe_target,
					exe_target_player = game.player_manager.get(exe_target_name);

				exe_target_player.frame();

				exe_target_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Evaluate]: new Effect({
			name: this.EffectName.Evaluate,
			applyEffect: function(game, player_using_ability, ability) {
				const
					player_evaluating_name = player_using_ability.visiting,
					player_evaluating = game.player_manager.get(player_evaluating_name),
					evaluated_role = game.role_manager.getRole(player_evaluating.getPercievedRole());

				const evaluatedPlayerInMafia =
					[Faction.MAFIA].includes(evaluated_role.faction);

				const evaluatedPlayerIsNeutralKilling = (
					evaluated_role.faction === Faction.NEUTRAL &&
					evaluated_role.alignment === Alignment.KILLING
				);

				let feedback = "";

				if (player_evaluating.isDoused) {
					feedback = Feedback.GOT_UNCLEAR_EVALUATION(player_evaluating_name);
				}
				else if (
					evaluatedPlayerInMafia ||
					evaluatedPlayerIsNeutralKilling
				) {
					feedback = Feedback.GOT_SUSPICIOUS_EVALUATION(player_evaluating_name);
				}
				else {
					feedback = Feedback.GOT_INNOCENT_EVALUATION(player_evaluating_name);
				}

				game.player_manager.removeManipulationEffectsFromPlayer(player_evaluating);

				player_using_ability.addFeedback(feedback);

				player_evaluating.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Track]: new Effect({
			name: this.EffectName.Track,
			applyEffect: function(game, player_using_ability, ability) {
				const
					tracked_player_name = player_using_ability.visiting,
					tracked_player = game.player_manager.get(tracked_player_name),
					player_seen_visiting = tracked_player.getPercievedVisit();

				let feedback = "";

				if (
					player_seen_visiting &&
					player_seen_visiting !== tracked_player_name
				) {
					feedback = Feedback.TRACKER_SAW_PLAYER_VISIT(tracked_player_name, player_seen_visiting);
				}
				else {
					feedback = Feedback.TRACKER_SAW_PLAYER_NOT_VISIT(tracked_player_name);
				}

				player_using_ability.addFeedback(feedback);

				tracked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Lookout]: new Effect({
			name: this.EffectName.Lookout,
			applyEffect: function(game, player_using_ability, ability) {

				const
					target_player_name = player_using_ability.visiting,
					target_player = game.player_manager.get(target_player_name);

				game.logger.log(`${player_using_ability.name} looks out at ${target_player_name}'s house`);

				let players_seen_visiting = [];

				game.player_manager.getPlayerList().forEach(player => {
					const player_visiting_name = player.getPercievedVisit();

					const isPlayerTarget = player.name === target_player.name;
					const isPlayerLookout = player.name === player_using_ability.name;
					const isPlayerVisitingTarget = player_visiting_name === target_player_name;

					if (
						!isPlayerTarget &&
						!isPlayerLookout &&
						isPlayerVisitingTarget
					) {
						players_seen_visiting.push(player);
					}
				});

				if (players_seen_visiting.length > 0)
					player_using_ability.addFeedback(Feedback.LOOKOUT_SEES_VISITS(target_player, players_seen_visiting));
				else
					player_using_ability.addFeedback(Feedback.LOOKOUT_SEES_NO_VISITS(target_player));

				target_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Investigate]: new Effect({
			name: this.EffectName.Investigate,
			applyEffect: function(game, player_using_ability, ability) {
				const
					investigated_player_name = player_using_ability.visiting,
					investigated_player = game.player_manager.get(investigated_player_name),
					evaluated_role_name = investigated_player.getPercievedRole();

				player_using_ability.addFeedback(Feedback.INVESTIGATED_PLAYERS_ROLE(investigated_player_name, evaluated_role_name));

				investigated_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Smith]: new Effect({
			name: this.EffectName.Smith,
			applyEffect: function(game, player_using_ability, ability) {
				const
					smithed_player_name = player_using_ability.visiting,
					smithed_player = game.player_manager.get(smithed_player_name);

				player_using_ability.addFeedback(Feedback.SMITHED_VEST_FOR_PLAYER(smithed_player))

				smithed_player.giveDefenseLevel(1);

				smithed_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfSmith]: new Effect({
			name: this.EffectName.SelfSmith,
			applyEffect: function(game, player_using_ability, ability) {
				player_using_ability.giveDefenseLevel(1);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Control]: new Effect({
			name: this.EffectName.Control,
			applyEffect: function(game, player_using_ability, ability, arg_values) {
				if (arg_values === undefined)
					throw new Error("Control.applyEffect: arg_values is undefined");
				
				const
					player_controlling_name = arg_values[AbilityArgName.PLAYER_CONTROLLING],
					player_controlling_into_name = arg_values[AbilityArgName.PLAYER_CONTROLLED_INTO],
					player_controlling = game.player_manager.get(player_controlling_name),
					player_controlling_role = game.role_manager.getRole(player_controlling.role),
					ability_to_control = player_controlling_role.abilities[0];

				const abilityToControlExists = ability_to_control !== null && ability_to_control !== undefined;

				const isTargetImmune = player_controlling_role.immunities.includes(Immunity.CONTROL);

				let num_ability_player_args = 0;
				let num_ability_non_player_args = 0;
				let isAbilityUsedUp = false;

				if (abilityToControlExists) {
					const ability_player_args =
						ability_to_control.args
						.filter(arg => arg.type === AbilityArgType.PLAYER);

					num_ability_player_args = ability_player_args.length;
					num_ability_non_player_args = ability_to_control.args.length - ability_player_args.length;

					const num_times_used = player_controlling.used[ability_to_control.name] ?? 0;

					isAbilityUsedUp = (
						ability_to_control.uses === AbilityUseCount.NONE ||
						(
							ability_to_control.uses !== AbilityUseCount.UNLIMITED &&
							num_times_used >= ability_to_control.uses
						)
					);
				}

				if (
					!abilityToControlExists ||
					isAbilityUsedUp ||
					num_ability_player_args > 1 ||
					num_ability_non_player_args !== 0 ||
					isTargetImmune
				) {
					player_using_ability.addFeedback(
						Feedback.CONTROL_FAILED(player_controlling_name)
					);
					return;
				}


				let willForceTargetToVisit = false;

				const doesAbilityArgExist = ability_to_control.args[0] !== undefined;
				if (doesAbilityArgExist) {
					const ability_arg = ability_to_control.args[0];

					const isAbilityArgVisitingSubtype = ability_arg.subtypes.includes(ArgumentSubtype.VISITING);

					willForceTargetToVisit = isAbilityArgVisitingSubtype;

					if (willForceTargetToVisit) {
						player_controlling.visiting = player_controlling_into_name;
					}
				}

				const ability_arguments = willForceTargetToVisit ? [player_controlling_into_name] : [];

				game.makePlayerDoAbility({
					player: player_controlling,
					ability_name: ability_to_control.name,
					ability_arguments: ability_arguments,
				});

				player_controlling.addFeedback(Feedback.CONTROLLED);

				player_using_ability.addFeedback(
					Feedback.CONTROL_SUCCEEDED(player_controlling_name, player_controlling_into_name)
				);

				player_using_ability.addFeedback(
					Feedback.INVESTIGATED_PLAYERS_ROLE(
						player_controlling_name,
						player_controlling.getPercievedRole()
					)
				);
			}
		}),

		[this.EffectName.Observe]: new Effect({
			name: this.EffectName.Observe,
			applyEffect: function(game, player_using_ability, ability) {
				const
					player_observing = game.player_manager.get(player_using_ability.visiting),
					percieved_role_of_target = game.role_manager.getRole( player_observing.getPercievedRole() ),
					percieved_faction_of_target = percieved_role_of_target.faction,
					last_player_observed_name = player_using_ability.last_player_observed_name,
					hasObservedPlayerBefore = last_player_observed_name !== undefined;

				let feedback = "";

				if (!hasObservedPlayerBefore) {
					feedback = Feedback.OBSERVED_WITH_NO_PREVIOUS_OBSERVE(player_observing);
				}
				else {
					const
						last_player_observed = game.player_manager.get(last_player_observed_name),
						percieved_role_of_last_target = game.role_manager.getRole( last_player_observed.getPercievedRole() ),
						percieved_faction_of_last_target = percieved_role_of_last_target.faction;

					if (last_player_observed.name === player_observing.name) {
						feedback = Feedback.OBSERVED_SAME_PERSON(player_observing);
					}
					else if (percieved_faction_of_target === percieved_faction_of_last_target) {
						feedback = Feedback.OBSERVED_WORKING_TOGETHER(player_observing, last_player_observed);
					}
					else if (percieved_faction_of_target !== percieved_faction_of_last_target) {
						feedback = Feedback.OBSERVED_NOT_WORKING_TOGETHER(player_observing, last_player_observed);
					}

					game.player_manager.removeManipulationEffectsFromPlayer(player_observing);
					game.player_manager.removeManipulationEffectsFromPlayer(last_player_observed);

					player_observing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
					last_player_observed.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
				}

				player_using_ability.last_player_observed_name = player_observing.name;

				player_using_ability.addFeedback(feedback);
			}
		}),

		[this.EffectName.Replace]: new Effect({
			name: this.EffectName.Replace,
			applyEffect: async function(game, player_using_ability, ability) {
				const
					player_replacing_name = player_using_ability.visiting,
					player_replacing = game.player_manager.get(player_replacing_name);

				// Attack Success
				if (player_replacing.defense < player_using_ability.attack) {
					const player_replacing_role = game.role_manager.getRole(player_replacing.role);
					await game.player_manager.convertPlayerToRole(player_using_ability, player_replacing_role);

					player_replacing.isUnidentifiable = true;

					player_using_ability.addFeedback(Feedback.REPLACED_PLAYER(player_replacing));
					player_replacing.addFeedback(Feedback.REPLACED_BY_REPLACER);

					player_replacing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
				}
				// Attack Failed
				else {
					player_using_ability.addFeedback(Feedback.REPLACE_FAILED(player_replacing));
				}
			}
		}),

		[this.EffectName.Kidnap]: new Effect({
			name: this.EffectName.Kidnap,
			applyEffect: async function(game, player_using_ability, ability) {
				const
					kidnapped_player_name = player_using_ability.visiting,
					kidnapped_player = game.player_manager.get(kidnapped_player_name),
					kidnapped_player_role = game.role_manager.getRole(kidnapped_player.role);

				game.logger.log(`${player_using_ability.name} attempts to kidnap ${kidnapped_player_name}.`);

				kidnapped_player.addFeedback(Feedback.KIDNAPPED);

				if (kidnapped_player.attack > 0) {
					player_using_ability.addFeedback(Feedback.ATTACK_BY_KIDNAPPED_PLAYER(kidnapped_player));
					kidnapped_player.addFeedback(Feedback.ATTACKED_KIDNAPPER);

					game.player_manager.attackPlayer({
						attacker_player: kidnapped_player,
						target_player: player_using_ability,
					});
				}
				else {
					player_using_ability.addFeedback(Feedback.KIDNAPPED_PLAYER(kidnapped_player));
				}

				if (
					!(kidnapped_player_role.immunities &&
						kidnapped_player_role.immunities.includes(Immunity.ROLEBLOCK))
				) {
					kidnapped_player.isRoleblocked = true;
					kidnapped_player.addFeedback(Feedback.ROLEBLOCKED_BY_KIDNAPPER);
				}
				else {
					kidnapped_player.addFeedback(Feedback.ROLEBLOCKED_BY_KIDNAPPER_BUT_IMMUNE);
				}

				kidnapped_player.giveDefenseLevel(4);

				await kidnapped_player.mute();
				await kidnapped_player.removeVotingAbility();

				await kidnapped_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

	}

	/**
	 * Get an effect object from an effect name
	 * @param {string} effect_name - The name of the effect
	 * @returns {Effect | undefined} undefined if effect name doesn't exist
	 */
	getEffect(effect_name) {
		return EffectManager.effects[effect_name];
	}

	/**
	 * @param {object} parameters - The parameters
	 * @param {string} parameters.effect_name - The name of the effect.
	 * @param {object} parameters.player_using_ability - The player using the ability which causes this effect
	 * @param {object} parameters.ability - The ability which causes this effect
	 * @param {{[arg_name: string]: string}} parameters.arg_values - The argument names and values passed by the player for the ability which causes this effect
	 * @returns {Promise<void>}
	 */
	async useEffect({effect_name, player_using_ability, ability, arg_values={}}) {
		const effect = this.getEffect(effect_name);

		if (effect !== undefined) {
			await effect.applyEffect(this.game, player_using_ability, ability, arg_values)
		}
	}
}

module.exports = EffectManager;