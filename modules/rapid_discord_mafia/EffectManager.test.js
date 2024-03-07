const { RoleNames, AbilityName, AbilityArgName, Feedback } = require("../enums");
const RapidDiscordMafia = require("./RapidDiscordMafia");
const Game = require("./game");
const roles = require("./roles");

describe('EffectManager', () => {
	/**
	 * @type Game
	 */
	let mock_game;

  const setupMockGame = async () => {
		await RapidDiscordMafia.setUpRapidDiscordMafia(true);
		mock_game = global.Game;
  };

  beforeEach(async () => {
		await setupMockGame();
  });

	describe('Roleblock Effect.applyEffect', () => {
		it('SHOULD set player roleblock property to true', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Escort,
					RoleNames.Mafioso,
				]
			);

			const escort_player = mock_game.Players.get(RoleNames.Escort);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.Mafioso }
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

			const escort_player = mock_game.Players.get(RoleNames.Escort);
			const escort2_player = mock_game.Players.get(RoleNames.Escort + "2");
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.Escort + "2" }
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

			const escort_player = mock_game.Players.get(RoleNames.Escort);
			const serial_killer_player = mock_game.Players.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.SerialKiller }
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

			const escort_player = mock_game.Players.get(RoleNames.Escort);
			const serial_killer_player = mock_game.Players.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				AbilityName.Roleblock,
				{ [AbilityArgName.PlayerRoleblocking]: RoleNames.SerialKiller }
			);
			serial_killer_player.useAbility(AbilityName.Cautious);

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

	describe('Cautious Effect.applyEffect', () => {
		it('SHOULD add feedback and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.SerialKiller,
					RoleNames.Doctor,
				]
			);

			const serial_killer_player = mock_game.Players.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			serial_killer_player.useAbility(
				AbilityName.Cautious
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

	describe('Heal Effect.applyEffect', () => {
		it('SHOULD give player defense level 2 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
				]
			);

			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name }
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

	describe('Self Heal Effect.applyEffect', () => {
		it('SHOULD give self defense level 2 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
				]
			);

			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				AbilityName.HealSelf,
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

	describe('Smith Effect.applyEffect', () => {
		it('SHOULD give feedback to smither, give player defense level 1, and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
					RoleNames.Blacksmith,
				]
			);

			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const blacksmith_player = mock_game.Players.get(RoleNames.Blacksmith);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				AbilityName.Smith,
				{ [AbilityArgName.PlayerSmithingFor]: mafioso_player.name }
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

	describe('Self Heal Effect.applyEffect', () => {
		it('SHOULD give self defense level 1 and add to their abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Mafioso,
					RoleNames.Doctor,
					RoleNames.Blacksmith,
				]
			);

			const blacksmith_player = mock_game.Players.get(RoleNames.Blacksmith);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				AbilityName.SelfSmith,
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

	describe('Attack Effect.applyEffect', () => {
		it('SHOULD have attacked player recieve attack and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
				]
			);

			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);
			const vigilante_player = mock_game.Players.get(RoleNames.Vigilante);

			await mock_game.startNight(mock_game.days_passed);

			vigilante_player.useAbility(
				AbilityName.Shoot,
				{ [AbilityArgName.PlayerShooting]: mafioso_player.name }
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

	describe('Frame Effect.applyEffect', () => {
		it('SHOULD frame player as mafioso and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const framer_player = mock_game.Players.get(RoleNames.Framer);
			const vigilante_player = mock_game.Players.get(RoleNames.Vigilante);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(
				AbilityName.Frame,
				{ [AbilityArgName.PlayerFraming]: vigilante_player.name }
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

	describe('Self Frame Effect.applyEffect', () => {
		it('SHOULD frame self as mafioso and add to abilities affected by', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Vigilante,
					RoleNames.Mafioso,
					RoleNames.Framer,
				]
			);

			const framer_player = mock_game.Players.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(AbilityName.SelfFrame);

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

	describe('Frame Exe Target Effect.applyEffect', () => {
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

			const executioner_player = mock_game.Players.get(RoleNames.Executioner);
			const exe_target_player = mock_game.Players.get(executioner_player.exe_target);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(AbilityName.FrameTarget);

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

	describe('Evaluate Effect.applyEffect', () => {
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

			const sheriff_player = mock_game.Players.get(RoleNames.Sheriff);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const framer_player = mock_game.Players.get(RoleNames.Framer);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(AbilityName.Frame,
				{ [AbilityArgName.PlayerFraming]: doctor_player.name }
			);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: doctor_player.name }
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

			const sheriff_player = mock_game.Players.get(RoleNames.Sheriff);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: mafioso_player.name }
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

			const sheriff_player = mock_game.Players.get(RoleNames.Sheriff);
			const serial_killer_player = mock_game.Players.get(RoleNames.SerialKiller);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: serial_killer_player.name }
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

			const sheriff_player = mock_game.Players.get(RoleNames.Sheriff);
			const impersonator_player = mock_game.Players.get(RoleNames.Impersonator);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(AbilityName.Evaluate,
				{ [AbilityArgName.PlayerEvaluating]: impersonator_player.name }
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

	describe('Track Effect.applyEffect', () => {
		it('SHOULD give correct feedback and add to abilities affected by WHEN target visits a player who isn\'t themself', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Tracker,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const tracker_player = mock_game.Players.get(RoleNames.Tracker);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name }
			);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name }
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

			const tracker_player = mock_game.Players.get(RoleNames.Tracker);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name }
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

			const tracker_player = mock_game.Players.get(RoleNames.Tracker);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(AbilityName.Track,
				{ [AbilityArgName.PlayerTracking]: doctor_player.name }
			);

			doctor_player.useAbility(AbilityName.HealSelf);

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

	describe('Lookout Effect.applyEffect', () => {
		it('SHOULD not show player visiting target and add ability affected by WHEN player is target', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Lookout,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const lookout_player = mock_game.Players.get(RoleNames.Lookout);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(AbilityName.HealSelf);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: doctor_player.name }
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

			const lookout_player = mock_game.Players.get(RoleNames.Lookout);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: doctor_player.name }
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

			const lookout_player = mock_game.Players.get(RoleNames.Lookout);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(AbilityName.Lookout,
				{ [AbilityArgName.PlayerWatching]: mafioso_player.name }
			);

			doctor_player.useAbility(AbilityName.Heal,
				{ [AbilityArgName.PlayerHealing]: mafioso_player.name }
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

	describe('Investigate Effect.applyEffect', () => {
		it('SHOULD get feedback that target is Doctor and add ability affected by WHEN target is Doctor', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleNames.Consigliere,
					RoleNames.Doctor,
					RoleNames.Mafioso,
				]
			);

			const consig_player = mock_game.Players.get(RoleNames.Consigliere);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);
			const mafioso_player = mock_game.Players.get(RoleNames.Mafioso);

			await mock_game.startNight(mock_game.days_passed);

			consig_player.useAbility(AbilityName.Investigate,
				{ [AbilityArgName.PlayerInvestigating]: doctor_player.name }
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

	describe('Control Effect.applyEffect', () => {
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

			const witch_player = mock_game.Players.get(RoleNames.Witch);
			const executioner_player = mock_game.Players.get(RoleNames.Executioner);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(AbilityName.FrameTarget);

			await mock_game.startDay();
			await mock_game.startTrial();

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: executioner_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				}
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

			const witch_player = mock_game.Players.get(RoleNames.Witch);
			const witch2_player = mock_game.Players.get(RoleNames.Witch + "2");

			await mock_game.startNight(mock_game.days_passed);


			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: witch2_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				}
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

			const witch_player = mock_game.Players.get(RoleNames.Witch);
			const executioner_player = mock_game.Players.get(RoleNames.Executioner);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: executioner_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				}
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

			const witch_player = mock_game.Players.get(RoleNames.Witch);
			const doctor_player = mock_game.Players.get(RoleNames.Doctor);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(AbilityName.Control,
				{
					[AbilityArgName.PlayerControlling]: doctor_player.name,
					[AbilityArgName.PlayerControlledInto]: RoleNames.Mafioso,
				}
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

	// @ TODO: Observe
	// @ TODO: Replace
	// @ TODO: Kidnap
});