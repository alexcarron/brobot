
const {Feedback, Phases, AbilityUses, ArgumentTypes, ArgumentSubtypes, Immunities, AbilityNames, RoleNames, Factions, AbilityTypes} = require("../enums.js");
const addAffect = function(ability_done, target_name) {
	if (![0, -1].includes(ability_done.uses)) {
		if (!global.Game.Players.get(ability_done.by).used[ability_done.name]) {
			global.Game.Players.get(ability_done.by).used[ability_done.name] = 0;
		}
		global.Game.Players.get(ability_done.by).used[ability_done.name] += 1;
	}

	console.log("\nAdding uses...");
	console.log(global.Game.Players.get(ability_done.by).used);
	global.Game.Players.get(target_name).affected_by.push(
		{
			"name": ability_done.name,
			"by": ability_done.by,
			"during_phase": global.Game.days_passed-0.5,
		}
	);
}

const givePlayerDefense = function(player_healing, defense_level) {
	console.log(`Healing ${player_healing.name} for ${defense_level} defense`);

	if (player_healing.defense < defense_level) {
		console.log(`Increased ${player_healing.name}'s defense from ${player_healing.defense} to ${defense_level}`);
		player_healing.defense = defense_level
	}
	else {
		console.log(`${player_healing_name}'s was already at or above ${defense_level}`);
	}
}

const attackPlayer = function(attacker_player, attacked_player) {
	console.log(`${attacker_player.name} attacks ${attacked_player.name} with ${attacker_player.attack} attack level against ${attacked_player.defense} defense level.`);

	// Attack Success
	if (attacked_player.defense < attacker_player.attack) {
		console.log("Attack Success");

		global.Game.addDeath(attacked_player, attacker_player);

		attacked_player.addFeedback(Feedback.KilledByAttack);
		attacker_player.addFeedback(Feedback.KilledPlayer(attacked_player.name));

		const target_role = global.Roles[attacked_player.role];
		if (attacker_player.role === RoleNames.Vigilante && target_role.faction === Factions.Town) {
			console.log("Vigilante Suicide Confirmed");

			addAffect(
				{
					"by": attacker_player.name,
					"name": AbilityNames.Suicide
				},
				attacker_player.name
			);
		}
	}
	// Attack Failed
	else {
		console.log("Attack Failed");

		const protection_affects_on_target = attacked_player.affected_by.filter(
			affect => {
				const ability = global.abilities[affect.name]
				return ability.type == AbilityTypes.Protection;
			}
		);

		if ( protection_affects_on_target.length > 0 ) {
			console.log("Victim has heal affects");

			for (let protection_affect of protection_affects_on_target) {
				const protecter_player = global.Game.Players.get(protection_affect.by);
				protecter_player.addFeedback(Feedback.ProtectedAnAttackedPlayer);

				console.log(`${protecter_player.name} has protected the victim ${attacked_player.name}`);

				if (protection_affect.name === AbilityNames.Smith) {
					console.log(`${protecter_player.name} successfully smithed a vest and achieved their win condition.`);

					protecter_player.addFeedback(Feedback.DidSuccesfulSmith);
					protecter_player.makeAWinner();
				}
			}
		}

		attacked_player.addFeedback(Feedback.AttackedButSurvived);
		attacker_player.addFeedback(Feedback.AttackFailed(attacked_player.name));
	}
}

/**
 * AbilityPerformed {
 * 	by: {Player.name},
 * 	name: {Ability.name},
 * 	args: [ ...{Args.value} ]
 * }
 */
const perform = {
	async roleblock(ability_performed) {
		const
			roleblocker_player_name = ability_performed.by,
			roleblocker_player = global.Game.Players.get(roleblocker_player_name),
			roleblocked_player_name = roleblocker_player.visiting,
			roleblocked_player = global.Game.Players.get(roleblocked_player_name),
			roleblocked_player_role = global.Roles[ roleblocked_player.role ];

		if ( !(roleblocked_player_role.immunities && roleblocked_player_role.immunities.includes(Immunities.Roleblock)) ) {
			roleblocked_player.isRoleblocked = true;
			roleblocked_player.addFeedback(Feedback.WasRoleblocked);
		}
		else {
			roleblocked_player.addFeedback(Feedback.WasRoleblockedButImmune);
		}

		if (
			roleblocked_player_role.name === "Serial Killer" &&
			!roleblocked_player.affected_by.some(affect => affect.name === "Cautious")
		) {
			console.log(`Serial Killer ${roleblocked_player_name} stabs ${roleblocker_player_name} as revenge for roleblocking them`);

			global.Game.abilities_performed[roleblocked_player_name] =
				{
					"name": AbilityNames.Knife,
					"by": roleblocked_player_name,
					"args": [ability_performed.by]
				}

			roleblocked_player.visiting = roleblocker_player_name;
			roleblocked_player.addFeedback(Feedback.AttackedRoleblocker);
		}

		roleblocker_player.addFeedback(Feedback.RoleblockedPlayer(roleblocked_player));
		addAffect(ability_performed, roleblocked_player_name);
	},
	async cautious(ability_performed) {
		const
			serial_killer_name = ability_performed.by,
			serial_killer_player = global.Game.Players.get(serial_killer_name);

		serial_killer_player.addFeedback(Feedback.DidCautious);
		addAffect(ability_performed, serial_killer_name);
	},
	async heal(ability_performed) {
		const
			healer_player_name = ability_performed.by,
			healer_player = global.Game.Players.get(healer_player_name),
			player_healing_name = healer_player.visiting,
			player_healing = global.Game.Players.get(player_healing_name);

		givePlayerDefense(player_healing, 2);

		addAffect(ability_performed, player_healing_name);
	},
	async selfHeal(ability_performed) {
		const
			self_healer_player_name = ability_performed.by,
			self_healer_player = global.Game.Players.get(self_healer_player_name);

		givePlayerDefense(self_healer_player, 2);

		addAffect(ability_performed, self_healer_player_name);
	},
	async order(ability_performed) {
		const
			godfather_name = ability_performed.by,
			godfather_player = global.Game.Players.get(godfather_name),
			player_killing_name = ability_performed.args["Player Killing"],
			mafioso_player = global.Game.Players.getPlayerWithRole("Mafioso");

		if (mafioso_player) {
			mafioso_player.visiting = player_killing_name;
			global.Game.abilities_performed[mafioso_player.name] =
				{
					"name": AbilityNames.Murder,
					"by": mafioso_player.name,
					"args": [player_killing_name]
				}

			mafioso_player.addFeedback(Feedback.OrderedByGodfather(player_killing_name));
		}
		else {
			godfather_player.visiting = player_killing_name;
			global.Game.abilities_performed[godfather_player.name] =
				{
					"name": AbilityNames.Murder,
					"by": godfather_player.name,
					"args": [player_killing_name]
				}

			godfather_player.addFeedback(Feedback.KillForMafioso(player_killing_name));
		}
	},
	async attack(ability_performed) {
		const
			attacker_player_name = ability_performed.by,
			attacker_player = global.Game.Players.get(attacker_player_name),
			attacked_player_name = attacker_player.visiting,
			attacked_player = global.Game.Players.get(attacked_player_name);

		attackPlayer(attacker_player, attacked_player);

		addAffect(ability_performed, attacked_player_name);
	},
	async frame(ability_performed) {
		const
			framer_player_name = ability_performed.by,
			framer_player = global.Game.Players.get(framer_player_name),
			framed_player_name = framer_player.visiting,
			framed_player = global.Game.Players.get(framed_player_name);

		framed_player.percieved.role = "Mafioso";
		addAffect(ability_performed, framed_player_name);
	},
	async selfFrame(ability_performed) {
		const
			self_framer_player_name = ability_performed.by,
			self_framer_player = global.Game.Players.get(self_framer_player_name);

		self_framer_player.percieved.role = "Mafioso";
		addAffect(ability_performed, self_framer_player_name);
	},
	async frameTarget(ability_performed) {
		const
			framer_player_name = ability_performed.by,
			framer_player = global.Game.Players.get(framer_player_name),
			exe_target_name = framer_player.exe_target,
			exe_target_player = global.Game.Players.get(exe_target_name);

		exe_target_player.percieved.role = "Mafioso";
		addAffect(ability_performed, exe_target_name);
	},
	async evaluate(ability_performed) {
		const
			evaluater_player_name = ability_performed.by,
			evaluater_player = global.Game.Players.get(evaluater_player_name),
			player_evaluating_name = evaluater_player.visiting,
			player_evaluating = global.Game.Players.get(player_evaluating_name),
			evaluated_role = global.Roles[ player_evaluating.getPercievedRole() ];

		let feedback = "";

		if (player_evaluating.isDoused) {
			console.log("Evaluatee doused.");
			feedback = Feedback.GotUnclearEvaluation(player_evaluating_name);
		}
		else if (
			["Mafia", "Coven"].includes(evaluated_role.faction) ||
			(evaluated_role.faction === "Neutral" && evaluated_role.alignment === "Killing")
		) {
			console.log("Evaluatee suspicious.");
			feedback = Feedback.GotSuspiciousEvaluation(player_evaluating_name);
		}
		else {
			console.log("Evaluatee innocent.");
			feedback = Feedback.GotInnocentEvaluation(player_evaluating_name);
		}

		console.log("Checking to get rid of manipulation affects");
		player_evaluating.removeManipulationAffects();

		evaluater_player.addFeedback(feedback);
		addAffect(ability_performed, player_evaluating_name);
	},
	async track(ability_performed) {
		const
			tracker_player_name = ability_performed.by,
			tracker_player = global.Game.Players.get(tracker_player_name),
			tracked_player_name = tracker_player.visiting,
			tracked_player = global.Game.Players.get(tracked_player_name),
			player_seen_visiting = tracked_player.getPercievedVisit();

		console.log({tracker_player_name, tracked_player_name, player_seen_visiting});

		let feedback = "";

		if (player_seen_visiting)
			feedback = Feedback.SawPlayerVisit(tracked_player_name, player_seen_visiting);
		else
			feedback = Feedback.SawPlayerNotVisit(tracked_player_name);

		tracker_player.addFeedback(feedback);
		addAffect(ability_performed, tracked_player_name);
	},
	async lookout(ability_performed) {
		const
			lookout_player_name = ability_performed.by,
			lookout_player = global.Game.Players.get(lookout_player_name),
			target_player_name = lookout_player.visiting,
			target_player = global.Game.Players.get(target_player_name);

		console.log(`${lookout_player_name} looks out at ${target_player_name}'s house`);

		let players_seen_visiting = [];

		global.Game.Players.getPlayerList().forEach(player => {
			const player_visiting_name = player.getPercievedVisit();

			if (player_visiting_name === target_player_name) {
				players_seen_visiting.push(player);
			}
		});

		if (players_seen_visiting.length > 0)
			lookout_player.addFeedback(Feedback.LookoutSeesVisits(target_player, players_seen_visiting));
		else
			lookout_player.addFeedback(Feedback.LookoutSeesNoVisits(target_player));
		
		addAffect(ability_performed, target_player_name);
	},
	async investigate(ability_performed) {
		const
			investigator_player_name = ability_performed.by,
			investigator_player = global.Game.Players.get(investigator_player_name),
			investigated_player_name = investigator_player.visiting,
			investigated_player = global.Game.Players.get(investigated_player_name),
			evaluated_role_name = investigated_player.getPercievedRole();

		investigator_player.addFeedback(Feedback.EvaluatedPlayersRole(investigated_player_name, evaluated_role_name));
		addAffect(ability_performed, investigated_player_name);
	},
	async smith(ability_performed) {
		const
			smither_player_name = ability_performed.by,
			smither_player = global.Game.Players.get(smither_player_name),
			smithed_player_name = smither_player.visiting,
			smithed_player = global.Game.Players.get(smithed_player_name);

		console.log({smither_player_name, smithed_player_name});

		givePlayerDefense(smithed_player, 1);

		addAffect(ability_performed, smithed_player_name);
	},
	async selfSmith(ability_performed) {
		const
			self_smither_player_name = ability_performed.by,
			self_smither_player = global.Game.Players.get(self_smither_player_name);

		givePlayerDefense(self_smither_player, 1);

		addAffect(ability_performed, self_smither_player_name);
	},
	async control(ability_performed) {
		const
			controller_player_name = ability_performed.by,
			player_controlling_name = ability_performed.args["Player Controlling"],
			player_controlling_into_name = ability_performed.args["Player Target Is Controlled Into"];

		console.log({player_controlling_name, player_controlling_into_name,});

		const controller_player = global.Game.Players.get(controller_player_name),
			player_controlling = global.Game.Players.get(player_controlling_name),
			player_controlling_role = global.Roles[player_controlling.role],
			ability_controlling = player_controlling_role.abilities[0];

		const num_player_args =
				ability_controlling ?
					ability_controlling.args.filter(arg => arg.type === ArgumentTypes.Player).length :
					0;

		const num_non_player_args =
				ability_controlling ?
					ability_controlling.args.filter(arg => arg.type !== ArgumentTypes.Player).length :
					0;

		console.log({controller_player, player_controlling, num_player_args, num_non_player_args, ability_controlling})

		if (
			!ability_controlling ||
			ability_controlling.uses === 0 ||
			!ability_controlling.phases_can_use.includes(Phases.Night) ||
			(
				player_controlling.used[ability_controlling.name] &&
				ability_controlling.uses !== AbilityUses.Unlimited &&
				player_controlling.used[ability_controlling.name] >= ability_controlling.uses
			) ||
			num_player_args > 1 ||
			num_non_player_args > 0 ||
			player_controlling_role.immunities.includes(Immunities.Control)
		) {
			console.log("Control failed");

			console.log(Feedback.ControlFailed(player_controlling_name));
			controller_player.addFeedback(Feedback.ControlFailed(player_controlling_name));
			return;
		}

		const
			isVisitingControlledInto = !!ability_controlling.args[0] && ability_controlling.args[0].subtypes.includes(ArgumentSubtypes.Visiting),
			ability_arguments = isVisitingControlledInto ? [player_controlling_into_name] : [];

		if (isVisitingControlledInto) {
			console.log(`Forcing ${player_controlling.name} to visit ${player_controlling_into_name}`)

			player_controlling.visiting = player_controlling_into_name;
		}

		global.Game.makePlayerDoAbility({
			player: player_controlling,
			ability_name: ability_controlling.name,
			ability_arguments: ability_arguments,
		});

		console.table(global.Game.abilities_performed);

		player_controlling.addFeedback(Feedback.Controlled);
		controller_player.addFeedback(Feedback.ControlSucceeded(player_controlling_name, player_controlling_into_name));
		controller_player.addFeedback(Feedback.EvaluatedPlayersRole(player_controlling_name, player_controlling.getPercievedRole()));
	},
	async observe(ability_performed) {
		const
			observer_player = global.Game.Players.get(ability_performed.by),
			player_observing = global.Game.Players.get(observer_player.visiting),
			percieved_role_of_target = global.Roles[ player_observing.getPercievedRole() ],
			percieved_faction_of_target = percieved_role_of_target.faction,
			last_player_observed_name = observer_player.last_player_observed_name;

		let feedback = "";

		if (!last_player_observed_name) {
			feedback = Feedback.ObservedWithNoPreviousObserve(player_observing);
		}
		else {
			const
				last_player_observed = global.Game.Players.get(last_player_observed_name),
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
			player_observing.removeManipulationAffects();
			last_player_observed.removeManipulationAffects();

			addAffect(ability_performed, player_observing.name);
			addAffect(ability_performed, last_player_observed.name);
		}

		observer_player.last_player_observed_name = player_observing.name;

		observer_player.addFeedback(feedback);
	},
	async replace(ability_performed) {
		const
			replacer_name = ability_performed.by,
			replacer_player = global.Game.Players.get(replacer_name),
			player_replacing_name = replacer_player.visiting,
			player_replacing = global.Game.Players.get(player_replacing_name);

		console.log(`${replacer_name} attempts to replace ${player_replacing_name}.`);

		// Attack Success
		if (player_replacing.defense < replacer_player.attack) {
			replacer_player.convertToRole(player_replacing.role);

			player_replacing.isUnidentifiable = true;

			replacer_player.addFeedback(Feedback.ReplacedPlayer(player_replacing));
			player_replacing.addFeedback(Feedback.ReplacedByReplacer());

			addAffect(ability_performed, player_replacing_name);
		}
		// Attack Failed
		else {
			replacer_player.addFeedback(Feedback.ReplaceFailed(player_replacing));
		}
	},
	async kidnap(ability_performed) {
		const
			kidnaper_name = ability_performed.by,
			kidnaper_player = global.Game.Players.get(kidnaper_name),
			kidnapped_player_name = kidnaper_player.visiting,
			kidnapped_player = global.Game.Players.get(kidnapped_player_name),
			kidnapped_player_role = global.Roles[kidnapped_player.role];

		console.log(`${kidnaper_name} attempts to kidnap ${kidnapped_player_name}.`);

		kidnapped_player.addFeedback(Feedback.Kidnapped);

		if (kidnapped_player.attack > 0) {
			kidnaper_player.addFeedback(Feedback.AttackedByKidnappedPlayer(kidnapped_player));
			kidnapped_player.addFeedback(Feedback.AttackedKidnapper);

			console.log("AFFECTED BY")
			console.log(kidnapped_player.affected_by);

			attackPlayer(kidnapped_player, kidnaper_player);
		}
		else {
			kidnaper_player.addFeedback(Feedback.KidnappedPlayer(kidnapped_player));
		}

		if (
			!(kidnapped_player.immunities &&
				kidnapped_player_role.immunities.includes(Immunities.Roleblock))
		) {
			kidnapped_player.isRoleblocked = true;
			kidnapped_player.addFeedback(Feedback.RoleblockedByKidnapper);
		}
		else {
			kidnapped_player.addFeedback(Feedback.RoleblockedByKidnapperButImmune);
		}

		givePlayerDefense(kidnapped_player, 4);
		await kidnapped_player.mute();
		await kidnapped_player.removeVotingAbility();
	},
}

module.exports = perform;