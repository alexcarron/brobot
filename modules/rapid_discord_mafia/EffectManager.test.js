const { RoleNames, AbilityName, AbilityArgName, Feedback } = require("../enums");
const RapidDiscordMafia = require("./RapidDiscordMafia");
const GameManager = require("./GameManager");

describe('EffectManager', () => {
	/**
	 * @type Game
	 */
	let mock_game;

  const setupMockGame = async () => {
		await RapidDiscordMafia.setUpRapidDiscordMafia(true);
		mock_game = global.game_manager;
  };

  beforeEach(async () => {
		await setupMockGame();
  });

	describe('RoleblockEffect.applyEffect()', () => {
		it('SHOULD set player roleblock property to true', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Escort,
					RoleNames.Mafioso,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleNames.Escort);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.Mafioso },
				mock_game
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			const mafioso_feedback = mafioso_player.feedback;

			expect(
				mafioso_feedback.includes(
					Feedback.WasRoleblocked
				)
			).toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.RoleblockedPlayer(mafioso_player))
			)
			.toBe(true);

			expect(mafioso_player.isRoleblocked).toBe(true);
			expect(escort_player.isRoleblocked).toBe(false);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === escort_player.name &&
						affect.name === AbilityName.Roleblock
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD not roleblock immune players', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Escort,
					RoleNames.Escort,
					RoleNames.Mafioso,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleNames.Escort);
			const escort2_player = mock_game.player_manager.get(RoleNames.Escort + "2");
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.Escort + "2" },
				mock_game
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			const escort2_feedback = escort2_player.feedback;

			expect(
				escort2_feedback.includes(
					Feedback.WasRoleblockedButImmune
				)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.RoleblockedPlayer(escort2_player))
			)
			.toBe(true);

			expect(escort2_player.isRoleblocked).toBe(false);
			expect(escort_player.isRoleblocked).toBe(false);
			expect(mafioso_player.isRoleblocked).toBe(false);
		});

		it('SHOULD have serial killer stab escort if not cautious', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Escort,
					RoleNames.SerialKiller,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleNames.Escort);
			const serial_killer_player = mock_game.player_manager.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.SerialKiller },
				mock_game
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[serial_killer_player.name]
			)
			.toEqual(
				{
					name: AbilityName.Knife,
					by: serial_killer_player.name,
					args: [escort_player.name]
				}
			);

			expect(serial_killer_player.visiting).toBe(escort_player.name);

			expect(
				serial_killer_player.feedback.includes(Feedback.AttackedRoleblocker) &&
				serial_killer_player.feedback.includes(Feedback.WasRoleblockedButImmune)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.RoleblockedPlayer(serial_killer_player))
			)
			.toBe(true);

			expect(escort_player.isRoleblocked).toBe(false);
			expect(serial_killer_player.isRoleblocked).toBe(false);
		});

		it('SHOULD have serial killer not stab escort if cautious', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Escort,
					RoleNames.SerialKiller,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleNames.Escort);
			const serial_killer_player = mock_game.player_manager.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.SerialKiller },
				mock_game
			);
			serial_killer_player.useAbility(AbilityName.Cautious, {}, mock_game);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[serial_killer_player.name]
			)
			.not.toEqual(
				{
					name: AbilityName.Knife,
					by: serial_killer_player.name,
					args: [escort_player.name]
				}
			);

			expect(serial_killer_player.visiting).not.toBe(escort_player.name);

			expect(
				!serial_killer_player.feedback.includes(Feedback.AttackedRoleblocker) &&
				serial_killer_player.feedback.includes(Feedback.WasRoleblockedButImmune)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.RoleblockedPlayer(serial_killer_player))
			)
			.toBe(true);

			expect(escort_player.isRoleblocked).toBe(false);
			expect(serial_killer_player.isRoleblocked).toBe(false);
		});
	});

	describe('CautiousEffect.applyEffect()', () => {
		it('SHOULD add feedback and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.SerialKiller,
					RoleNames.Doctor,
				]
			);

			const serial_killer_player = mock_game.player_manager.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			serial_killer_player.useAbility(
				AbilityName.Cautious,
				{},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				serial_killer_player.feedback.includes(
					Feedback.DidCautious
				)
			).toBe(true);

			expect(
				serial_killer_player.affected_by.some(affect => {
					return (
						affect.by === serial_killer_player.name &&
						affect.name === AbilityName.Cautious
					)
				})
			)
			.toBe(true);
		});
	});

	describe('HealEffect.applyEffect()', () => {
		it('SHOULD give player defense level 2 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(mafioso_player.defense).toBe(2);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === doctor_player.name &&
						affect.name === AbilityName.Heal
					)
				})
			)
			.toBe(true);
		});
	});

	describe('Self HealEffect.applyEffect()', () => {
		it('SHOULD give self defense level 2 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				AbilityName.HealSelf,
				{},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(doctor_player.defense).toBe(2);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === doctor_player.name &&
						affect.name === AbilityName.HealSelf
					)
				})
			)
			.toBe(true);
		});
	});

	describe('SmithEffect.applyEffect()', () => {
		it('SHOULD give feedback to smither, give player defense level 1, and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
					RoleNames.Blacksmith,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const blacksmith_player = mock_game.player_manager.get(RoleNames.Blacksmith);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				AbilityName.Smith,
				{ [AbilityArgName.PlayerSmithingFor]: mafioso_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(mafioso_player.defense).toBe(1);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === blacksmith_player.name &&
						affect.name === AbilityName.Smith
					)
				})
			)
			.toBe(true);

			expect(
				blacksmith_player.feedback.includes(
					Feedback.SmithedVestForPlayer(mafioso_player)
				)
			)
			.toBe(true);
		});
	});

	describe('Self HealEffect.applyEffect()', () => {
		it('SHOULD give self defense level 1 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
					RoleNames.Blacksmith,
				]
			);

			const blacksmith_player = mock_game.player_manager.get(RoleNames.Blacksmith);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				AbilityName.SelfSmith,
				{},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(blacksmith_player.defense).toBe(1);

			expect(
				blacksmith_player.affected_by.some(affect => {
					return (
						affect.by === blacksmith_player.name &&
						affect.name === AbilityName.SelfSmith
					)
				})
			)
			.toBe(true);
		});
	});

	describe('AttackEffect.applyEffect()', () => {
		it('SHOULD have attacked player recieve attack and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);
			const vigilante_player = mock_game.player_manager.get(RoleNames.Vigilante);

			await mock_game.startNight(mock_game.days_passed);

			vigilante_player.useAbility(
				AbilityName.Shoot,
				{ [AbilityArgName.PlayerShooting]: mafioso_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mafioso_player.feedback.includes(Feedback.KilledByAttack)
			)
			.toBe(true);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === vigilante_player.name &&
						affect.name === AbilityName.Shoot
					)
				})
			)
			.toBe(true);
		});
	});

	describe('FrameEffect.applyEffect()', () => {
		it('SHOULD frame player as mafioso and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const framer_player = mock_game.player_manager.get(RoleNames.Framer);
			const vigilante_player = mock_game.player_manager.get(RoleNames.Vigilante);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(
				AbilityName.Frame,
				{ [AbilityArgName.PlayerFraming]: vigilante_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(vigilante_player.percieved.role)
			.toBe(RoleNames.Mafioso);

			expect(
				vigilante_player.affected_by.some(affect => {
					return (
						affect.by === framer_player.name &&
						affect.name === AbilityName.Frame
					)
				})
			)
			.toBe(true);
		});
	});

	describe('Self FrameEffect.applyEffect()', () => {
		it('SHOULD frame self as mafioso and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const framer_player = mock_game.player_manager.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(AbilityName.SelfFrame, {}, mock_game);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(framer_player.percieved.role)
			.toBe(RoleNames.Mafioso);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === framer_player.name &&
						affect.name === AbilityName.SelfFrame
					)
				})
			)
			.toBe(true);
		});
	});

	describe('Frame Exe TargetEffect.applyEffect()', () => {
		it('SHOULD frame executioner target as mafioso and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Doctor,
					RoleNames.Executioner,
					RoleNames.Mafioso,
				]
			);

			const executioner_player = mock_game.player_manager.get(RoleNames.Executioner);
			const exe_target_player = mock_game.player_manager.get(executioner_player.exe_target);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(AbilityName.FrameTarget, {}, mock_game);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(exe_target_player.percieved.role)
			.toBe(RoleNames.Mafioso);

			expect(
				exe_target_player.affected_by.some(affect => {
					return (
						affect.by === executioner_player.name &&
						affect.name === AbilityName.FrameTarget
					)
				})
			)
			.toBe(true);
		});
	});

	describe('EvaluateEffect.applyEffect()', () => {
		it('SHOULD remove manipulation affects, give suspicious feedback, and add to abilities affected by WHEN evaluating Mafioso', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Sheriff,
					RoleNames.Doctor,
					RoleNames.Framer,
					RoleNames.Mafioso,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleNames.Sheriff);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const framer_player = mock_game.player_manager.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(AbilityName.Frame,
				{ [AbilityArgName.PlayerFraming]: doctor_player.name },
				mock_game,
			);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(doctor_player.percieved.role)
			.not.toBe(RoleNames.Mafioso);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.name === AbilityName.Frame
					)
				})
			)
			.toBe(false);

			expect(
				sheriff_player.feedback.includes(
					Feedback.GotSuspiciousEvaluation(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === sheriff_player.name &&
						affect.name === AbilityName.Evaluate
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give unclear evaluation feedback WHEN evaluting player is doused', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Sheriff,
					RoleNames.Mafioso,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleNames.Sheriff);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: mafioso_player.name },
				mock_game,
			);

			mafioso_player.douse();

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GotUnclearEvaluation(mafioso_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD give suspicious evaluation feedback WHEN evaluting Neutral Killing role', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Sheriff,
					RoleNames.SerialKiller,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleNames.Sheriff);
			const serial_killer_player = mock_game.player_manager.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: serial_killer_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GotSuspiciousEvaluation(serial_killer_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD give innocent evaluation feedback WHEN evaluting non-mafia and non-neutral killing role', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Sheriff,
					RoleNames.Impersonator,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleNames.Sheriff);
			const impersonator_player = mock_game.player_manager.get(RoleNames.Impersonator);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: impersonator_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GotInnocentEvaluation(impersonator_player.name)
				)
			)
			.toBe(true);
		});
	});

	describe('TrackEffect.applyEffect()', () => {
		it('SHOULD give correct feedback and add to abilities affected by WHEN target visits a player who isn\'t themself', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Tracker,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleNames.Tracker);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name },
				mock_game,
			);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TrackerSawPlayerVisit(doctor_player.name, mafioso_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.Track
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give correct feedback and add to abilities affected by WHEN target doesn\'t visit a player', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Tracker,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleNames.Tracker);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TrackerSawPlayerNotVisit(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.Track
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give correct feedback and add to abilities affected by WHEN target visits self', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Tracker,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleNames.Tracker);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name },
				mock_game,
			);

			doctor_player.useAbility(AbilityName.HealSelf, {}, mock_game);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TrackerSawPlayerNotVisit(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.Track
					)
				})
			)
			.toBe(true);
		});
	});

	describe('LookoutEffect.applyEffect()', () => {
		it('SHOULD not show player visiting target and add ability affected by WHEN player is target', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Lookout,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleNames.Lookout);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(AbilityName.HealSelf, {}, mock_game);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LookoutSeesNoVisits(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === lookout_player.name &&
						affect.name === AbilityName.Lookout
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD not show player visiting target WHEN player is lookout', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Lookout,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleNames.Lookout);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LookoutSeesNoVisits(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === lookout_player.name &&
						affect.name === AbilityName.Lookout
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD show player visiting target WHEN player is not target or lookout and is visiting target', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Lookout,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleNames.Lookout);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: mafioso_player.name },
				mock_game,
			);

			doctor_player.useAbility(AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LookoutSeesVisits(mafioso_player, [doctor_player])
				)
			)
			.toBe(true);
		});
	});

	describe('InvestigateEffect.applyEffect()', () => {
		it('SHOULD get feedback that target is Doctor and add ability affected by WHEN target is Doctor', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Consigliere,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const consig_player = mock_game.player_manager.get(RoleNames.Consigliere);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			consig_player.useAbility(AbilityName.Investigate,
				{ [AbilityArgName.PlayerInvestigating]: doctor_player.name },
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				consig_player.feedback.includes(
					Feedback.InvestigatedPlayersRole(doctor_player.name, RoleNames.Doctor)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === consig_player.name &&
						affect.name === AbilityName.Investigate
					)
				})
			)
			.toBe(true);
		});
	});

	describe('ControlEffect.applyEffect()', () => {
		it('SHOULD get feedback that cannot control WHEN target ability has limited uses and target used all uses', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Witch,
					RoleNames.Executioner,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleNames.Witch);
			const executioner_player = mock_game.player_manager.get(RoleNames.Executioner);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(AbilityName.FrameTarget, {}, mock_game);

			await mock_game.startDay();
			await mock_game.startTrial();

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: executioner_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				witch_player.feedback.includes(
					Feedback.ControlFailed(executioner_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD get feedback that cannot control WHEN target is immune', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Witch,
					RoleNames.Witch,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleNames.Witch);
			const witch2_player = mock_game.player_manager.get(RoleNames.Witch + "2");

			await mock_game.startNight(mock_game.days_passed);


			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: witch2_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				witch_player.feedback.includes(
					Feedback.ControlFailed(witch2_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD add controlled ability use to game abilities performed WHEN target has ability, has not used it up, ability has no arguments, and is not immune,', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Witch,
					RoleNames.Executioner,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleNames.Witch);
			const executioner_player = mock_game.player_manager.get(RoleNames.Executioner);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: executioner_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[executioner_player.name]
			)
			.toEqual({
				name: AbilityName.FrameTarget,
				by: executioner_player.name,
				args: [],
			});

			expect(
				executioner_player.feedback.includes(
					Feedback.Controlled
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.ControlSucceeded(executioner_player.name, RoleNames.Mafioso)
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.InvestigatedPlayersRole(executioner_player.name, RoleNames.Executioner)
				)
			)
			.toBe(true);
		});

		it('SHOULD add controlled ability use to game abilities performed and makes target visit player WHEN target has ability, has not used it up, ability has a single player argument, and is not immune,', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Witch,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleNames.Witch);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: doctor_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				},
				mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[doctor_player.name]
			)
			.toEqual({
				name: AbilityName.Heal,
				by: doctor_player.name,
				args: [RoleNames.Mafioso],
			});

			expect(doctor_player.visiting)
			.toEqual(RoleNames.Mafioso);

			expect(
				doctor_player.feedback.includes(
					Feedback.Controlled
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.ControlSucceeded(doctor_player.name, RoleNames.Mafioso)
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.InvestigatedPlayersRole(doctor_player.name, RoleNames.Doctor)
				)
			)
			.toBe(true);
		});
	});

	describe('ObserveEffect.applyEffect()', () => {
		it('SHOULD get feedback and update last player observed WHEN first time observing player', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Oracle,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleNames.Oracle);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: doctor_player.name
			},
			mock_game,
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.ObservedWithNoPreviousObserve(doctor_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(doctor_player.name);
		});

		it('SHOULD get feedback that observed same person, update last player observed, remove target manipulation effects, and add ability affected by WHEN observing player after observing same player', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Oracle,
					RoleNames.Doctor,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleNames.Oracle);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const framer_player = mock_game.player_manager.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: doctor_player.name
			},
			mock_game,);

			framer_player.useAbility(AbilityName.Frame, {
				[AbilityArgName.PlayerFraming]: doctor_player.name
			},
			mock_game,);

			await mock_game.startDay();

			expect(doctor_player.percieved.role).toBe(RoleNames.Mafioso);

			await mock_game.startTrial();

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: doctor_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.ObservedSamePerson(doctor_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(doctor_player.name);

			expect(doctor_player.percieved.role).not.toBe(RoleNames.Doctor);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.Observe
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that targets in same faction, update last player observed, and add ability affected by WHEN observing player in Mafia after observing player in Mafia', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Oracle,
					RoleNames.Doctor,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleNames.Oracle);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);
			const framer_player = mock_game.player_manager.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: framer_player.name
			},
			mock_game,);

			await mock_game.startDay();
			await mock_game.startTrial();

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: mafioso_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.ObservedWorkingTogether(mafioso_player, framer_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(mafioso_player.name);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.Observe
					)
				})
			)
			.toBe(true);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.Observe
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that targets are not in same faction, update last player observed, and add ability affected by WHEN observing player in Mafia after observing player in Mafia', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Oracle,
					RoleNames.Doctor,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleNames.Oracle);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const framer_player = mock_game.player_manager.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: framer_player.name
			},
			mock_game,);

			await mock_game.startDay();
			await mock_game.startTrial();

			oracle_player.useAbility(AbilityName.Observe, {
				[AbilityArgName.PlayerObserving]: doctor_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.ObservedNotWorkingTogether(doctor_player, framer_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(doctor_player.name);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.Observe
					)
				})
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.Observe
					)
				})
			)
			.toBe(true);
		});
	});

	describe('ReplaceEffect.applyEffect()', () => {
		it('SHOULD convert player to Doctor, make target unidentifiable, add feedback to player and target, and add to abilities affected by WHEN target is Doctor and has no defense', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Impersonator,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const impersonator_player = mock_game.player_manager.get(RoleNames.Impersonator);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			impersonator_player.useAbility(AbilityName.Replace, {
				[AbilityArgName.PlayerReplacing]: doctor_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(impersonator_player.role).toBe(RoleNames.Doctor);
			expect(doctor_player.isUnidentifiable).toBe(true);

			expect(
				impersonator_player.feedback.includes(
					Feedback.ReplacedPlayer(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.feedback.includes(
					Feedback.ReplacedByReplacer
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === impersonator_player.name &&
						affect.name === AbilityName.Replace
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that replace failed and not convert to Mafioso WHEN Mafioso has defense', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Impersonator,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const impersonator_player = mock_game.player_manager.get(RoleNames.Impersonator);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);
			const mafioso_player = mock_game.player_manager.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(AbilityName.Heal, {
				[AbilityArgName.PlayerHealing]: mafioso_player.name
			},
			mock_game,);

			impersonator_player.useAbility(AbilityName.Replace, {
				[AbilityArgName.PlayerReplacing]: mafioso_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(impersonator_player.role).not.toBe(RoleNames.Doctor);
			expect(mafioso_player.isUnidentifiable).toBe(false);

			expect(
				impersonator_player.feedback.includes(
					Feedback.ReplaceFailed(mafioso_player)
				)
			)
			.toBe(true);

			expect(
				mafioso_player.feedback.includes(
					Feedback.ReplacedByReplacer
				)
			)
			.toBe(false);
		});

	});

	describe('KidnapEffect.applyEffect()', () => {
		it('SHOULD add kidnapped feedback to target and player, roleblock player, add roleblocked feedback to target, give target defense level of four, mute target, remove target voting ability, and add to abilities affected by WHEN target has no attack level and is not immune to roleblocking', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Kidnapper,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleNames.Kidnapper);
			const doctor_player = mock_game.player_manager.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(AbilityName.Kidnap, {
				[AbilityArgName.PlayerKidnapping]: doctor_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect( doctor_player.feedback.includes(Feedback.Kidnapped) )
			.toBe(true);

			expect( doctor_player.feedback.includes(
				Feedback.RoleblockedByKidnapper
			) )
			.toBe(true);

			expect( kidnapper_player.feedback.includes(
				Feedback.KidnappedPlayer(doctor_player)
			) )
			.toBe(true);

			expect(doctor_player.isRoleblocked).toBe(true);
			expect(doctor_player.defense).toBe(4);
			expect(doctor_player.isMuted).toBe(true);
			expect(doctor_player.canVote).toBe(false);

			console.log(doctor_player.affected_by);
			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === kidnapper_player.name &&
						affect.name === AbilityName.Kidnap
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD add attacked by kidnapped feedback to target and player and target attacks plater WHEN target has attack level', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Kidnapper,
					RoleNames.Vigilante,
					RoleNames.Mafioso,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleNames.Kidnapper);
			const vigilante_player = mock_game.player_manager.get(RoleNames.Vigilante);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(AbilityName.Kidnap, {
				[AbilityArgName.PlayerKidnapping]: vigilante_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.next_deaths.some(death => {
					return death.victim === kidnapper_player.name
				})
			)
			.toBe(true);

			expect(
				vigilante_player.feedback.includes(
					Feedback.AttackedKidnapper
				)
			)
			.toBe(true);

			expect(
				kidnapper_player.feedback.includes(
					Feedback.AttackedByKidnappedPlayer(vigilante_player)
				)
			)
			.toBe(true);
		});

		it('SHOULD not be roleblocked and recieve feedback WHEN target is immune to roleblocks', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Kidnapper,
					RoleNames.Escort,
					RoleNames.Mafioso,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleNames.Kidnapper);
			const escort_player = mock_game.player_manager.get(RoleNames.Escort);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(AbilityName.Kidnap, {
				[AbilityArgName.PlayerKidnapping]: escort_player.name
			},
			mock_game,);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(escort_player.isRoleblocked)
			.toBe(false);

			expect(
				escort_player.feedback.includes(
					Feedback.RoleblockedByKidnapperButImmune
				)
			)
			.toBe(true);
		});
	});
});