const Effect = require("./Effect");
const { RoleNames, AbilityName, AbilityArgName, Factions, Alignments, Feedback, Immunities, AbilityUses, ArgumentTypes, ArgumentSubtypes } = require("../enums");
const Logger = require("./Logger");

/**
 * Used to handle ability effects and apply them
 */
class EffectManager {
	/**
	 * @param {Game | null} game
	 * @param {Logger} logger
	 */
	constructor(game, logger) {
		console.log({game});
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
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				console.log({game, player_using_ability, ability, arg_values})
				const
					roleblocked_player_name = player_using_ability.visiting,
					roleblocked_player = game.player_manager.get(roleblocked_player_name),
					roleblocked_player_role = global.Roles[ roleblocked_player.role ];

				console.log({roleblocked_player_name, roleblocked_player, roleblocked_player_role});

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
					!roleblocked_player.affected_by.some(
						affect => affect.name === AbilityName.Cautious
					)
				) {
					console.log(`${RoleNames.SerialKiller} ${roleblocked_player_name} stabs ${player_using_ability.name} as revenge for roleblocking them`);

					game.abilities_performed[roleblocked_player_name] =
						{
							"name": AbilityName.Knife,
							"by": roleblocked_player_name,
							"args": [player_using_ability.name]
						}

					roleblocked_player.visiting = player_using_ability.name;
					roleblocked_player.addFeedback(Feedback.AttackedRoleblocker);
				}

				player_using_ability.addFeedback(Feedback.RoleblockedPlayer(roleblocked_player));

				roleblocked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Cautious]: new Effect({
			name: this.EffectName.Cautious,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				player_using_ability.addFeedback(Feedback.DidCautious);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Heal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					player_healing_name = player_using_ability.visiting,
					player_healing = game.player_manager.get(player_healing_name);

				player_healing.giveDefenseLevel(2);

				player_healing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfHeal]: new Effect({
			name: this.EffectName.SelfHeal,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
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
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					attacked_player_name = player_using_ability.visiting,
					attacked_player = game.player_manager.get(attacked_player_name);

				attacked_player.receiveAttackFrom(player_using_ability, game);

				attacked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5)
			}
		}),

		[this.EffectName.Frame]: new Effect({
			name: this.EffectName.Frame,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					framed_player_name = player_using_ability.visiting,
					framed_player = game.player_manager.get(framed_player_name);

				framed_player.frame();

				framed_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfFrame]: new Effect({
			name: this.EffectName.SelfFrame,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				player_using_ability.frame();

				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.FrameTarget]: new Effect({
			name: this.EffectName.FrameTarget,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					exe_target_name = player_using_ability.exe_target,
					exe_target_player = game.player_manager.get(exe_target_name);

				exe_target_player.frame();

				exe_target_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Evaluate]: new Effect({
			name: this.EffectName.Evaluate,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					player_evaluating_name = player_using_ability.visiting,
					player_evaluating = game.player_manager.get(player_evaluating_name),
					evaluated_role = global.Roles[ player_evaluating.getPercievedRole() ];

				const evaluatedPlayerInMafia =
					[Factions.Mafia].includes(evaluated_role.faction);

				const evaluatedPlayerIsNeutralKilling = (
					evaluated_role.faction === Factions.Neutral &&
					evaluated_role.alignment === Alignments.Killing
				);

				let feedback = "";

				if (player_evaluating.isDoused) {
					console.log("Evaluatee doused.");
					feedback = Feedback.GotUnclearEvaluation(player_evaluating_name);
				}
				else if (
					evaluatedPlayerInMafia ||
					evaluatedPlayerIsNeutralKilling
				) {
					console.log("Evaluatee suspicious.");
					feedback = Feedback.GotSuspiciousEvaluation(player_evaluating_name);
				}
				else {
					console.log("Evaluatee innocent.");
					feedback = Feedback.GotInnocentEvaluation(player_evaluating_name);
				}

				console.log("Checking to get rid of manipulation affects");
				player_evaluating.removeManipulationAffects(game);

				player_using_ability.addFeedback(feedback);

				player_evaluating.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Track]: new Effect({
			name: this.EffectName.Track,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					tracked_player_name = player_using_ability.visiting,
					tracked_player = game.player_manager.get(tracked_player_name),
					player_seen_visiting = tracked_player.getPercievedVisit();

				console.log({tracker_player_name: player_using_ability.name, tracked_player_name, player_seen_visiting});

				let feedback = "";

				if (
					player_seen_visiting &&
					player_seen_visiting !== tracked_player_name
				) {
					feedback = Feedback.TrackerSawPlayerVisit(tracked_player_name, player_seen_visiting);
				}
				else {
					feedback = Feedback.TrackerSawPlayerNotVisit(tracked_player_name);
				}

				player_using_ability.addFeedback(feedback);

				tracked_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Lookout]: new Effect({
			name: this.EffectName.Lookout,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {

				const
					target_player_name = player_using_ability.visiting,
					target_player = game.player_manager.get(target_player_name);

				console.log(`${player_using_ability.name} looks out at ${target_player_name}'s house`);

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
					player_using_ability.addFeedback(Feedback.LookoutSeesVisits(target_player, players_seen_visiting));
				else
					player_using_ability.addFeedback(Feedback.LookoutSeesNoVisits(target_player));

				target_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Investigate]: new Effect({
			name: this.EffectName.Investigate,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					investigated_player_name = player_using_ability.visiting,
					investigated_player = game.player_manager.get(investigated_player_name),
					evaluated_role_name = investigated_player.getPercievedRole();

				player_using_ability.addFeedback(Feedback.InvestigatedPlayersRole(investigated_player_name, evaluated_role_name));

				investigated_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Smith]: new Effect({
			name: this.EffectName.Smith,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					smithed_player_name = player_using_ability.visiting,
					smithed_player = game.player_manager.get(smithed_player_name);

				console.log({smither_player_name: player_using_ability.name, smithed_player_name});

				player_using_ability.addFeedback(Feedback.SmithedVestForPlayer(smithed_player))

				smithed_player.giveDefenseLevel(1);

				smithed_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.SelfSmith]: new Effect({
			name: this.EffectName.SelfSmith,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				player_using_ability.giveDefenseLevel(1);
				player_using_ability.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
			}
		}),

		[this.EffectName.Control]: new Effect({
			name: this.EffectName.Control,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					player_controlling_name = arg_values[AbilityArgName.PlayerControlling],
					player_controlling_into_name = arg_values[AbilityArgName.PlayerControlledInto],
					player_controlling = game.player_manager.get(player_controlling_name),
					player_controlling_role = global.Roles[player_controlling.role],
					ability_to_control = player_controlling_role.abilities[0];

				const abilityToControlExists = ability_to_control !== null && ability_to_control !== undefined;

				const isTargetImmune = player_controlling_role.immunities.includes(Immunities.Control);

				let num_ability_player_args = 0;
				let num_ability_non_player_args = 0;
				let isAbilityUsedUp = false;

				if (abilityToControlExists) {
					const ability_player_args =
						ability_to_control.args
						.filter(arg => arg.type === ArgumentTypes.Player);

					num_ability_player_args = ability_player_args.length;
					num_ability_non_player_args = ability_to_control.args.length - ability_player_args.length;

					const num_times_used = player_controlling.used[ability_to_control.name] ?? 0;

					isAbilityUsedUp = (
						ability_to_control.uses === AbilityUses.None ||
						(
							ability_to_control.uses !== AbilityUses.Unlimited &&
							num_times_used >= ability_to_control.uses
						)
					);
				}

				console.log({
					controller_player: player_using_ability,
					player_controlling,
					num_ability_player_args,
					num_ability_non_player_args,
					player_controlling_role, ability_to_control,
					abilityToControlExists,
					isAbilityUsedUp,
					isTargetImmune,
				})

				if (
					!abilityToControlExists ||
					isAbilityUsedUp ||
					num_ability_player_args > 1 ||
					num_ability_non_player_args !== 0 ||
					isTargetImmune
				) {
					console.log("Control failed");

					player_using_ability.addFeedback(
						Feedback.ControlFailed(player_controlling_name)
					);
					return;
				}


				let willForceTargetToVisit = false;

				const doesAbilityArgExist = ability_to_control.args[0] !== undefined;
				if (doesAbilityArgExist) {
					const ability_arg = ability_to_control.args[0];

					const isAbilityArgVisitingSubtype = ability_arg.subtypes.includes(ArgumentSubtypes.Visiting);

					willForceTargetToVisit = isAbilityArgVisitingSubtype;

					if (willForceTargetToVisit) {
						console.log(`Forcing ${player_controlling.name} to visit ${player_controlling_into_name}`)

						player_controlling.visiting = player_controlling_into_name;
					}
				}

				const ability_arguments = willForceTargetToVisit ? [player_controlling_into_name] : [];

				game.makePlayerDoAbility({
					player: player_controlling,
					ability_name: ability_to_control.name,
					ability_arguments: ability_arguments,
				});

				player_controlling.addFeedback(Feedback.Controlled);

				player_using_ability.addFeedback(
					Feedback.ControlSucceeded(player_controlling_name, player_controlling_into_name)
				);

				player_using_ability.addFeedback(
					Feedback.InvestigatedPlayersRole(
						player_controlling_name,
						player_controlling.getPercievedRole()
					)
				);
			}
		}),

		[this.EffectName.Observe]: new Effect({
			name: this.EffectName.Observe,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					player_observing = game.player_manager.get(player_using_ability.visiting),
					percieved_role_of_target = global.Roles[ player_observing.getPercievedRole() ],
					percieved_faction_of_target = percieved_role_of_target.faction,
					last_player_observed_name = player_using_ability.last_player_observed_name,
					hasObservedPlayerBefore = last_player_observed_name !== undefined;

				let feedback = "";

				if (!hasObservedPlayerBefore) {
					feedback = Feedback.ObservedWithNoPreviousObserve(player_observing);
				}
				else {
					const
						last_player_observed = game.player_manager.get(last_player_observed_name),
						percieved_role_of_last_target = global.Roles[ last_player_observed.getPercievedRole() ],
						percieved_faction_of_last_target = percieved_role_of_last_target.faction;

					if (last_player_observed.name === player_observing.name) {
						feedback = Feedback.ObservedSamePerson(player_observing);
					}
					else if (percieved_faction_of_target === percieved_faction_of_last_target) {
						feedback = Feedback.ObservedWorkingTogether(player_observing, last_player_observed);
					}
					else if (percieved_faction_of_target !== percieved_faction_of_last_target) {
						feedback = Feedback.ObservedNotWorkingTogether(player_observing, last_player_observed);
					}

					console.log("Checking to get rid of manipulation affects");
					player_observing.removeManipulationAffects(game);
					last_player_observed.removeManipulationAffects(game);

					player_observing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
					last_player_observed.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
				}

				player_using_ability.last_player_observed_name = player_observing.name;

				player_using_ability.addFeedback(feedback);
			}
		}),

		[this.EffectName.Replace]: new Effect({
			name: this.EffectName.Replace,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					player_replacing_name = player_using_ability.visiting,
					player_replacing = game.player_manager.get(player_replacing_name);

				console.log(`${player_using_ability.name} attempts to replace ${player_replacing_name}.`);

				// Attack Success
				if (player_replacing.defense < player_using_ability.attack) {
					player_using_ability.convertToRole(player_replacing.role, game);

					player_replacing.isUnidentifiable = true;

					player_using_ability.addFeedback(Feedback.ReplacedPlayer(player_replacing));
					player_replacing.addFeedback(Feedback.ReplacedByReplacer);

					player_replacing.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
				}
				// Attack Failed
				else {
					player_using_ability.addFeedback(Feedback.ReplaceFailed(player_replacing));
				}
			}
		}),

		[this.EffectName.Kidnap]: new Effect({
			name: this.EffectName.Kidnap,
			applyEffect: async function(game, player_using_ability, ability, arg_values) {
				const
					kidnapped_player_name = player_using_ability.visiting,
					kidnapped_player = game.player_manager.get(kidnapped_player_name),
					kidnapped_player_role = global.Roles[kidnapped_player.role];

				console.log({kidnapped_player_name, kidnapped_player, kidnapped_player_role});

				console.log(`${player_using_ability.name} attempts to kidnap ${kidnapped_player_name}.`);

				kidnapped_player.addFeedback(Feedback.Kidnapped);

				if (kidnapped_player.attack > 0) {
					player_using_ability.addFeedback(Feedback.AttackedByKidnappedPlayer(kidnapped_player));
					kidnapped_player.addFeedback(Feedback.AttackedKidnapper);

					player_using_ability.receiveAttackFrom(kidnapped_player, game);
				}
				else {
					player_using_ability.addFeedback(Feedback.KidnappedPlayer(kidnapped_player));
				}

				if (
					!(kidnapped_player_role.immunities &&
						kidnapped_player_role.immunities.includes(Immunities.Roleblock))
				) {
					kidnapped_player.isRoleblocked = true;
					kidnapped_player.addFeedback(Feedback.RoleblockedByKidnapper);
				}
				else {
					kidnapped_player.addFeedback(Feedback.RoleblockedByKidnapperButImmune);
				}

				kidnapped_player.giveDefenseLevel(4);

				await kidnapped_player.mute();
				await kidnapped_player.removeVotingAbility();

				console.log("Adding ability affected by");
				await kidnapped_player.addAbilityAffectedBy(player_using_ability, ability.name, game.days_passed - 0.5);
				console.log("Added ability affected by");
			}
		}),

	}

	/**
	 * Get an effect object from an effect name
	 * @param {string} effect_name
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
	 * @returns {Promise<void>}
	 */
	async useEffect({effect_name, player_using_ability, ability, arg_values={}}) {
		console.log({effect_name, player_using_ability, ability, arg_values});
		const effect = this.getEffect(effect_name);

		if (effect !== undefined) {
			await effect.applyEffect(this.game, player_using_ability, ability, arg_values)
		}
	}
}

module.exports = EffectManager;