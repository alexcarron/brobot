
const {Feedback, Phases, AbilityUses, ArgumentTypes, ArgumentSubtypes, Immunities} = require("./enums.js");
const all_abilities = global.Game.all_abilities;
const addAffect = function(ability_done, target_name) {
	let ability = all_abilities[ability_done.name];

	if (![0, -1].includes(ability.uses)) {
		if (!global.Game.Players.get(ability_done.by).used[ability.name]) {
			global.Game.Players.get(ability_done.by).used[ability.name] = 0;
		}
		global.Game.Players.get(ability_done.by).used[ability.name] += 1;
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

		if ( !(roleblocked_player_role.immunities && roleblocked_player_role.immunities.includes("roleblock")) ) {
			roleblocked_player.isRoleblocked = true;
			roleblocked_player.addFeedback(Feedback.WasRoleblocked);
		}
		else {
			roleblocked_player.addFeedback(Feedback.WasRoleblockedButImmune);
		}

		if (
			roleblocked_player_role.name === "Serial Killer" &&
			!global.Game.Players.affected_by.some(affect => affect.name === "Cautious")
		) {
			console.log(`Serial Killer ${roleblocked_player_name} stabs ${roleblocker_player_name} as revenge for roleblocking them`);

			global.Game.abilities_performed[roleblocked_player_name] =
				{
					"name": "Knife",
					"by": roleblocked_player_name,
					"args": [ability_performed.by]
				}

			roleblocked_player.visiting = roleblocker_player_name;
			roleblocked_player.addFeedback(Feedback.AttackedRoleblocker);
		}

		addAffect(ability_performed, roleblocker_player_name);
	},
	async silenceCurse(ability_performed) {
		const
			fool_name = ability_performed.by,
			fool_player = global.Game.Players.get(fool_name);

		global.Game.isSilentCursed = true;
		fool_player.addFeedback(Feedback.DidSilenceCurse);
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

		console.log(`Healing ${player_healing_name} for 2 defense`);

		if (player_healing.defense < 2) {
			console.log(`Increased ${player_healing_name}'s defense from ${player_healing.defense} to 2`);
			player_healing.defense = 2
		}
		else {
			console.log(`${player_healing_name}'s was already at or above 2`);
		}

		addAffect(ability_performed, player_healing_name);
	},
	async selfHeal(ability_performed) {
		const
			self_healer_player_name = ability_performed.by,
			self_healer_player = global.Game.Players.get(self_healer_player_name);

		if (self_healer_player.defense < 2)
			self_healer_player.defense = 2;

		addAffect(ability_performed, self_healer_player_name);
	},
	async order(ability_performed) {
		const
			player_killing_name = ability_performed.args[0],
			mafioso_player = global.Game.Players.getPlayerWithRole("Mafioso");

		mafioso_player.visiting = player_killing_name;
		global.Game.abilities_performed[mafioso_player.name] =
			{
				"name": "Murder",
				"by": mafioso_player.name,
				"args": [player_killing_name]
			}

			mafioso_player.addFeedback(Feedback.OrderedByGodfather(player_killing_name));
	},
	async attack(ability_performed) {
		const
			attacker_player_name = ability_performed.by,
			attacker_player = global.Game.Players.get(attacker_player_name),
			attacked_player_name = attacker_player.visiting,
			attacked_player = global.Game.Players.get(attacked_player_name);

		console.log(`${attacker_player_name} attacks ${attacked_player_name} with ${attacker_player.attack} attack level against ${attacked_player.defense} defense level.`);

		// Attack Success
		if (attacked_player.defense < attacker_player.attack) {
			console.log("Attack Success");

			global.Game.addVictimToNextDeaths(attacked_player, attacker_player);

			attacked_player.addFeedback(Feedback.KilledByAttack);
			attacker_player.addFeedback(Feedback.KilledPlayer(attacked_player_name));

			const target_role = global.Roles[attacked_player.role];
			if (attacker_player.role === "Vigilante" && target_role.faction === "Town") {
				console.log("Vigilante Suicide Confirmed");

				addAffect(
					{
						"by": attacker_player_name,
						"name": "Suicide"
					},
					attacker_player_name
				);
			}
		}
		// Attack Failed
		else {
			console.log("Attack Failled");

			const target_heal_affects = attacked_player.affected_by.filter(
				affect => ["Heal", "Smith"].includes(affect.name)
			);

			if ( target_heal_affects.length > 0 ) {
				console.log("Victim has heal affects");

				for (let heal_affect of target_heal_affects) {
					const healer_player = global.Game.Players.get(heal_affect.by);
					healer_player.addFeedback(Feedback.ProtectedAnAttackedPlayer);

					console.log(`${healer_player.name} has healed the victim ${attacked_player_name}`);

					if (heal_affect.name === "Smith") {
						console.log(`${healer_player.name} successfully smithed a vest and achieved their win condition.`);

						healer_player.addFeedback(Feedback.DidSuccesfulSmith);
						healer_player.hasWon = true;
					}
				}
			}

			attacked_player.addFeedback(Feedback.AttackedButSurvived);
			attacker_player.addFeedback(Feedback.AttackFailed(attacked_player_name));
		}

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
		} else if (
			["Mafia", "Coven"].includes(evaluated_role.faction) ||
			(evaluated_role.faction === "Neutral" && evaluated_role.alignment === "Killing")
		) {
			console.log("Evaluatee suspicious.");
			feedback = Feedback.GotSuspiciousEvaluation(player_evaluating_name);
		} else {
			console.log("Evaluatee innocent.");
			feedback = Feedback.GotInnocentEvaluation(player_evaluating_name);
		}

		console.log("Checking to get rid of manipulation affects");
		if (player_evaluating.affected_by) {
			for (let [index, affect] of player_evaluating.affected_by.entries()) {
				console.log({affect});
				if (all_abilities[affect.name].type === "manipulation") {
					console.log("Found manipulation affect. Removing affect and reseting percieved.");

					player_evaluating.affected_by.splice(index, 1);
					player_evaluating.resetPercieved();
				}
			}
		}

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

		if (smithed_player.defense < 1)
			smithed_player.defense = 1;

		addAffect(ability_performed, smithed_player_name);
	},
	async selfSmith(ability_performed) {
		const
			self_smither_player_name = ability_performed.by,
			self_smither_player = global.Game.Players.get(self_smither_player_name);

		if (self_smither_player.defense < 1)
			self_smither_player.defense = 1;

		addAffect(ability_performed, self_smither_player_name);
	},
	async control(ability_performed) {
		const
			controller_player_name = ability_performed.by,
			player_controlling_name = ability_performed.args[0],
			player_controlling_into_name = ability_performed.args[1];

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
			ability_controlling.isLimboOnly ||
			ability_controlling.uses === 0 ||
			ability_controlling.activation_phase !== Phases.Night ||
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
}

module.exports = perform;