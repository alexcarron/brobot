const RapidDiscordMafia = require("./rapid-discord-mafia");
const { GameManager } = require("./game-manager");
const { Feedback } = require("./constants/possible-messages");
const { AbilityName } = require("./ability");
const { AbilityArgName } = require("./arg");
const { RoleName } = require("./role");

describe('EffectManager', () => {
	/**
	 * @type GameManager
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
					RoleName.ESCORT,
					RoleName.MAFIOSO,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleName.ESCORT);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);



			escort_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.ROLEBLOCK),
				{ [AbilityArgName.PLAYER_ROLEBLOCKING]: RoleName.MAFIOSO },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			const mafioso_feedback = mafioso_player.feedback;

			expect(
				mafioso_feedback.includes(
					Feedback.WAS_ROLEBLOCKED
				)
			).toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.ROLEBLOCKED_PLAYER(mafioso_player))
			)
			.toBe(true);

			expect(mafioso_player.isRoleblocked).toBe(true);
			expect(escort_player.isRoleblocked).toBe(false);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === escort_player.name &&
						affect.name === AbilityName.ROLEBLOCK
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD not roleblock immune players', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.ESCORT,
					RoleName.ESCORT,
					RoleName.MAFIOSO,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleName.ESCORT);
			const escort2_player = mock_game.player_manager.get(RoleName.ESCORT + "2");
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.ROLEBLOCK),
				{ [AbilityArgName.PLAYER_ROLEBLOCKING]: RoleName.ESCORT + "2" },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			const escort2_feedback = escort2_player.feedback;

			expect(
				escort2_feedback.includes(
					Feedback.WAS_ROLEBLOCKED_BUT_IMMUNE
				)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.ROLEBLOCKED_PLAYER(escort2_player))
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
					RoleName.ESCORT,
					RoleName.SERIAL_KILLER,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleName.ESCORT);
			const serial_killer_player = mock_game.player_manager.get(RoleName.SERIAL_KILLER);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.ROLEBLOCK),
				{ [AbilityArgName.PLAYER_ROLEBLOCKING]: RoleName.SERIAL_KILLER },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[serial_killer_player.name]
			)
			.toEqual(
				{
					name: AbilityName.KNIFE,
					by: serial_killer_player.name,
					args: [escort_player.name]
				}
			);

			expect(serial_killer_player.visiting).toBe(escort_player.name);

			expect(
				serial_killer_player.feedback.includes(Feedback.ATTACKED_ROLEBLOCKER) &&
				serial_killer_player.feedback.includes(Feedback.WAS_ROLEBLOCKED_BUT_IMMUNE)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.ROLEBLOCKED_PLAYER(serial_killer_player))
			)
			.toBe(true);

			expect(escort_player.isRoleblocked).toBe(false);
			expect(serial_killer_player.isRoleblocked).toBe(false);
		});

		it('SHOULD have serial killer not stab escort if cautious', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.ESCORT,
					RoleName.SERIAL_KILLER,
				]
			);

			const escort_player = mock_game.player_manager.get(RoleName.ESCORT);
			const serial_killer_player = mock_game.player_manager.get(RoleName.SERIAL_KILLER);

			await mock_game.startNight(mock_game.days_passed);

			escort_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.ROLEBLOCK),
				{ [AbilityArgName.PLAYER_ROLEBLOCKING]: RoleName.SERIAL_KILLER },
			);
			serial_killer_player.useAbility(mock_game.ability_manager.getAbility(AbilityName.CAUTIOUS));

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[serial_killer_player.name]
			)
			.not.toEqual(
				{
					name: AbilityName.KNIFE,
					by: serial_killer_player.name,
					args: [escort_player.name]
				}
			);

			expect(serial_killer_player.visiting).not.toBe(escort_player.name);

			expect(
				!serial_killer_player.feedback.includes(Feedback.ATTACKED_ROLEBLOCKER) &&
				serial_killer_player.feedback.includes(Feedback.WAS_ROLEBLOCKED_BUT_IMMUNE)
			)
			.toBe(true);

			expect(
				escort_player.feedback.includes(Feedback.ROLEBLOCKED_PLAYER(serial_killer_player))
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
					RoleName.SERIAL_KILLER,
					RoleName.DOCTOR,
				]
			);

			const serial_killer_player = mock_game.player_manager.get(RoleName.SERIAL_KILLER);

			await mock_game.startNight(mock_game.days_passed);

			serial_killer_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.CAUTIOUS)
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				serial_killer_player.feedback.includes(
					Feedback.DID_CAUTIOUS
				)
			).toBe(true);

			expect(
				serial_killer_player.affected_by.some(affect => {
					return (
						affect.by === serial_killer_player.name &&
						affect.name === AbilityName.CAUTIOUS
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
					RoleName.MAFIOSO,
					RoleName.DOCTOR,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL),
				{ [AbilityArgName.PLAYER_HEALING]: mafioso_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(mafioso_player.defense).toBe(2);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === doctor_player.name &&
						affect.name === AbilityName.HEAL
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
					RoleName.MAFIOSO,
					RoleName.DOCTOR,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL_SELF),
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(doctor_player.defense).toBe(2);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === doctor_player.name &&
						affect.name === AbilityName.HEAL_SELF
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
					RoleName.MAFIOSO,
					RoleName.DOCTOR,
					RoleName.BLACKSMITH,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const blacksmith_player = mock_game.player_manager.get(RoleName.BLACKSMITH);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.SMITH),
				{ [AbilityArgName.PLAYER_SMITHING_FOR]: mafioso_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(mafioso_player.defense).toBe(1);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === blacksmith_player.name &&
						affect.name === AbilityName.SMITH
					)
				})
			)
			.toBe(true);

			expect(
				blacksmith_player.feedback.includes(
					Feedback.SMITHED_VEST_FOR_PLAYER(mafioso_player)
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
					RoleName.MAFIOSO,
					RoleName.DOCTOR,
					RoleName.BLACKSMITH,
				]
			);

			const blacksmith_player = mock_game.player_manager.get(RoleName.BLACKSMITH);

			await mock_game.startNight(mock_game.days_passed);

			blacksmith_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.SELF_SMITH),
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(blacksmith_player.defense).toBe(1);

			expect(
				blacksmith_player.affected_by.some(affect => {
					return (
						affect.by === blacksmith_player.name &&
						affect.name === AbilityName.SELF_SMITH
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
					RoleName.VIGILANTE,
					RoleName.MAFIOSO,
				]
			);

			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);
			const vigilante_player = mock_game.player_manager.get(RoleName.VIGILANTE);

			await mock_game.startNight(mock_game.days_passed);

			vigilante_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.SHOOT),
				{ [AbilityArgName.PLAYER_SHOOTING]: mafioso_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mafioso_player.feedback.includes(Feedback.KILLED_BY_ATTACK)
			)
			.toBe(true);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === vigilante_player.name &&
						affect.name === AbilityName.SHOOT
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
					RoleName.VIGILANTE,
					RoleName.MAFIOSO,
					RoleName.FRAMER,
				]
			);

			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);
			const vigilante_player = mock_game.player_manager.get(RoleName.VIGILANTE);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.FRAME),
				{ [AbilityArgName.PLAYER_FRAMING]: vigilante_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(vigilante_player.percieved.role)
			.toBe(RoleName.MAFIOSO);

			expect(
				vigilante_player.affected_by.some(affect => {
					return (
						affect.by === framer_player.name &&
						affect.name === AbilityName.FRAME
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
					RoleName.VIGILANTE,
					RoleName.MAFIOSO,
					RoleName.FRAMER,
				]
			);

			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.SELF_FRAME)
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(framer_player.percieved.role)
			.toBe(RoleName.MAFIOSO);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === framer_player.name &&
						affect.name === AbilityName.SELF_FRAME
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
					RoleName.VIGILANTE,
					RoleName.DOCTOR,
					RoleName.EXECUTIONER,
					RoleName.MAFIOSO,
				]
			);

			const executioner_player = mock_game.player_manager.get(RoleName.EXECUTIONER);
			const exe_target_player = mock_game.player_manager.get(executioner_player.exe_target);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.FRAME_TARGET)
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(exe_target_player.percieved.role)
			.toBe(RoleName.MAFIOSO);

			expect(
				exe_target_player.affected_by.some(affect => {
					return (
						affect.by === executioner_player.name &&
						affect.name === AbilityName.FRAME_TARGET
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
					RoleName.SHERIFF,
					RoleName.DOCTOR,
					RoleName.FRAMER,
					RoleName.MAFIOSO,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleName.SHERIFF);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);

			await mock_game.startNight(mock_game.days_passed);

			framer_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.FRAME),
				{ [AbilityArgName.PLAYER_FRAMING]: doctor_player.name },
			);

			sheriff_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.EVALUATE),
				{ [AbilityArgName.PLAYER_EVLUATING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(doctor_player.percieved.role)
			.not.toBe(RoleName.MAFIOSO);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.name === AbilityName.FRAME
					)
				})
			)
			.toBe(false);

			expect(
				sheriff_player.feedback.includes(
					Feedback.GOT_SUSPICIOUS_EVALUATION(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === sheriff_player.name &&
						affect.name === AbilityName.EVALUATE
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give unclear evaluation feedback WHEN evaluting player is doused', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.SHERIFF,
					RoleName.MAFIOSO,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleName.SHERIFF);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.EVALUATE),
				{ [AbilityArgName.PLAYER_EVLUATING]: mafioso_player.name },
			);

			mafioso_player.douse();

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GOT_UNCLEAR_EVALUATION(mafioso_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD give suspicious evaluation feedback WHEN evaluting Neutral Killing role', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.SHERIFF,
					RoleName.SERIAL_KILLER,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleName.SHERIFF);
			const serial_killer_player = mock_game.player_manager.get(RoleName.SERIAL_KILLER);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.EVALUATE),
				{ [AbilityArgName.PLAYER_EVLUATING]: serial_killer_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GOT_SUSPICIOUS_EVALUATION(serial_killer_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD give innocent evaluation feedback WHEN evaluting non-mafia and non-neutral killing role', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.SHERIFF,
					RoleName.IMPERSONATOR,
				]
			);

			const sheriff_player = mock_game.player_manager.get(RoleName.SHERIFF);
			const impersonator_player = mock_game.player_manager.get(RoleName.IMPERSONATOR);

			await mock_game.startNight(mock_game.days_passed);

			sheriff_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.EVALUATE),
				{ [AbilityArgName.PLAYER_EVLUATING]: impersonator_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				sheriff_player.feedback.includes(
					Feedback.GOT_INNOCENT_EVALUATION(impersonator_player.name)
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
					RoleName.TRACKER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleName.TRACKER);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL),
				{ [AbilityArgName.PLAYER_HEALING]: mafioso_player.name }
			);

			tracker_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.TRACK),
				{ [AbilityArgName.PLAYER_TRACKING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TRACKER_SAW_PLAYER_VISIT(doctor_player.name, mafioso_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.TRACK
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give correct feedback and add to abilities affected by WHEN target doesn\'t visit a player', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.TRACKER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleName.TRACKER);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.TRACK),
				{ [AbilityArgName.PLAYER_TRACKING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TRACKER_SAW_PLAYER_NOT_VISIT(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.TRACK
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD give correct feedback and add to abilities affected by WHEN target visits self', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.TRACKER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const tracker_player = mock_game.player_manager.get(RoleName.TRACKER);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			tracker_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.TRACK),
				{ [AbilityArgName.PLAYER_TRACKING]: doctor_player.name },
			);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL_SELF)
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				tracker_player.feedback.includes(
					Feedback.TRACKER_SAW_PLAYER_NOT_VISIT(doctor_player.name)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === tracker_player.name &&
						affect.name === AbilityName.TRACK
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
					RoleName.LOOKOUT,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleName.LOOKOUT);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL_SELF)
			);

			lookout_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.LOOKOUT),
				{ [AbilityArgName.PLAYER_WATCHING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LOOKOUT_SEES_NO_VISITS(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === lookout_player.name &&
						affect.name === AbilityName.LOOKOUT
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD not show player visiting target WHEN player is lookout', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.LOOKOUT,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleName.LOOKOUT);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.LOOKOUT),
				{ [AbilityArgName.PLAYER_WATCHING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LOOKOUT_SEES_NO_VISITS(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === lookout_player.name &&
						affect.name === AbilityName.LOOKOUT
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD show player visiting target WHEN player is not target or lookout and is visiting target', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.LOOKOUT,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const lookout_player = mock_game.player_manager.get(RoleName.LOOKOUT);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			lookout_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.LOOKOUT),
				{ [AbilityArgName.PLAYER_WATCHING]: mafioso_player.name },
			);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL),
				{ [AbilityArgName.PLAYER_HEALING]: mafioso_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				lookout_player.feedback.includes(
					Feedback.LOOKOUT_SEES_VISITS(mafioso_player, [doctor_player])
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
					RoleName.CONSIGLIERE,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const consig_player = mock_game.player_manager.get(RoleName.CONSIGLIERE);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			consig_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.INVESTIGATE),
				{ [AbilityArgName.PLAYER_INVESTIGATING]: doctor_player.name },
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				consig_player.feedback.includes(
					Feedback.INVESTIGATED_PLAYERS_ROLE(doctor_player.name, RoleName.DOCTOR)
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === consig_player.name &&
						affect.name === AbilityName.INVESTIGATE
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
					RoleName.WITCH,
					RoleName.EXECUTIONER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleName.WITCH);
			const executioner_player = mock_game.player_manager.get(RoleName.EXECUTIONER);

			await mock_game.startNight(mock_game.days_passed);

			executioner_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.FRAME_TARGET),
			);

			await mock_game.startDay();
			await mock_game.startTrial();

			witch_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.CONTROL),
				{
					[AbilityArgName.PLAYER_CONTROLLING]: executioner_player.name,
					[AbilityArgName.PLAYER_CONTROLLED_INTO]: RoleName.MAFIOSO,
				},
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				witch_player.feedback.includes(
					Feedback.CONTROL_FAILED(executioner_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD get feedback that cannot control WHEN target is immune', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.WITCH,
					RoleName.WITCH,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleName.WITCH);
			const witch2_player = mock_game.player_manager.get(RoleName.WITCH + "2");

			await mock_game.startNight(mock_game.days_passed);


			witch_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.CONTROL),
				{
					[AbilityArgName.PLAYER_CONTROLLING]: witch2_player.name,
					[AbilityArgName.PLAYER_CONTROLLED_INTO]: RoleName.MAFIOSO,
				},
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				witch_player.feedback.includes(
					Feedback.CONTROL_FAILED(witch2_player.name)
				)
			)
			.toBe(true);
		});

		it('SHOULD add controlled ability use to game abilities performed WHEN target has ability, has not used it up, ability has no arguments, and is not immune,', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.WITCH,
					RoleName.EXECUTIONER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleName.WITCH);
			const executioner_player = mock_game.player_manager.get(RoleName.EXECUTIONER);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.CONTROL),
				{
					[AbilityArgName.PLAYER_CONTROLLING]: executioner_player.name,
					[AbilityArgName.PLAYER_CONTROLLED_INTO]: RoleName.MAFIOSO,
				},
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[executioner_player.name]
			)
			.toEqual({
				name: AbilityName.FRAME_TARGET,
				by: executioner_player.name,
				args: [],
			});

			expect(
				executioner_player.feedback.includes(
					Feedback.CONTROLLED
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.CONTROL_SUCCEEDED(executioner_player.name, RoleName.MAFIOSO)
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.INVESTIGATED_PLAYERS_ROLE(executioner_player.name, RoleName.EXECUTIONER)
				)
			)
			.toBe(true);
		});

		it('SHOULD add controlled ability use to game abilities performed and makes target visit player WHEN target has ability, has not used it up, ability has a single player argument, and is not immune,', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.WITCH,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const witch_player = mock_game.player_manager.get(RoleName.WITCH);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			witch_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.CONTROL),
				{
					[AbilityArgName.PLAYER_CONTROLLING]: doctor_player.name,
					[AbilityArgName.PLAYER_CONTROLLED_INTO]: RoleName.MAFIOSO,
				},
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				mock_game.abilities_performed[doctor_player.name]
			)
			.toEqual({
				name: AbilityName.HEAL,
				by: doctor_player.name,
				args: [RoleName.MAFIOSO],
			});

			expect(doctor_player.visiting)
			.toEqual(RoleName.MAFIOSO);

			expect(
				doctor_player.feedback.includes(
					Feedback.CONTROLLED
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.CONTROL_SUCCEEDED(doctor_player.name, RoleName.MAFIOSO)
				)
			)
			.toBe(true);

			expect(
				witch_player.feedback.includes(
					Feedback.INVESTIGATED_PLAYERS_ROLE(doctor_player.name, RoleName.DOCTOR)
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
					RoleName.ORACLE,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleName.ORACLE);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE),
				{
				[AbilityArgName.PLAYER_OBSERVING]: doctor_player.name
			},
			);

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.OBSERVED_WITH_NO_PREVIOUS_OBSERVE(doctor_player)
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
					RoleName.ORACLE,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
					RoleName.FRAMER,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleName.ORACLE);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: doctor_player.name
			});

			framer_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.FRAME), {
				[AbilityArgName.PLAYER_FRAMING]: doctor_player.name
			});

			await mock_game.startDay();

			expect(doctor_player.percieved.role).toBe(RoleName.MAFIOSO);

			await mock_game.startTrial();

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: doctor_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.OBSERVED_SAME_PERSON(doctor_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(doctor_player.name);

			expect(doctor_player.percieved.role).not.toBe(RoleName.DOCTOR);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.OBSERVE
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that targets in same faction, update last player observed, and add ability affected by WHEN observing player in Mafia after observing player in Mafia', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.ORACLE,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
					RoleName.FRAMER,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleName.ORACLE);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);
			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: framer_player.name
			});

			await mock_game.startDay();
			await mock_game.startTrial();

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: mafioso_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.OBSERVED_WORKING_TOGETHER(mafioso_player, framer_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(mafioso_player.name);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.OBSERVE
					)
				})
			)
			.toBe(true);

			expect(
				mafioso_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.OBSERVE
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that targets are not in same faction, update last player observed, and add ability affected by WHEN observing player in Mafia after observing player in Mafia', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.ORACLE,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
					RoleName.FRAMER,
				]
			);

			const oracle_player = mock_game.player_manager.get(RoleName.ORACLE);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const framer_player = mock_game.player_manager.get(RoleName.FRAMER);

			await mock_game.startNight(mock_game.days_passed);

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: framer_player.name
			});

			await mock_game.startDay();
			await mock_game.startTrial();

			oracle_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.OBSERVE), {
				[AbilityArgName.PLAYER_OBSERVING]: doctor_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(
				oracle_player.feedback.includes(
					Feedback.OBSERVED_NOT_WORKING_TOGETHER(doctor_player, framer_player)
				)
			)
			.toBe(true);

			expect(oracle_player.last_player_observed_name)
			.toBe(doctor_player.name);

			expect(
				framer_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.OBSERVE
					)
				})
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === oracle_player.name &&
						affect.name === AbilityName.OBSERVE
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
					RoleName.IMPERSONATOR,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const impersonator_player = mock_game.player_manager.get(RoleName.IMPERSONATOR);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			impersonator_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.REPLACE), {
				[AbilityArgName.PLAYER_REPLACING]: doctor_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(impersonator_player.role).toBe(RoleName.DOCTOR);
			expect(doctor_player.isUnidentifiable).toBe(true);

			expect(
				impersonator_player.feedback.includes(
					Feedback.REPLACED_PLAYER(doctor_player)
				)
			)
			.toBe(true);

			expect(
				doctor_player.feedback.includes(
					Feedback.REPLACED_BY_REPLACER
				)
			)
			.toBe(true);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === impersonator_player.name &&
						affect.name === AbilityName.REPLACE
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD get feedback that replace failed and not convert to Mafioso WHEN Mafioso has defense', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.IMPERSONATOR,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const impersonator_player = mock_game.player_manager.get(RoleName.IMPERSONATOR);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);
			const mafioso_player = mock_game.player_manager.get(RoleName.MAFIOSO);

			await mock_game.startNight(mock_game.days_passed);

			doctor_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.HEAL), {
				[AbilityArgName.PLAYER_HEALING]: mafioso_player.name
			});

			impersonator_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.REPLACE), {
				[AbilityArgName.PLAYER_REPLACING]: mafioso_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(impersonator_player.role).not.toBe(RoleName.DOCTOR);
			expect(mafioso_player.isUnidentifiable).toBe(false);

			expect(
				impersonator_player.feedback.includes(
					Feedback.REPLACE_FAILED(mafioso_player)
				)
			)
			.toBe(true);

			expect(
				mafioso_player.feedback.includes(
					Feedback.REPLACED_BY_REPLACER
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
					RoleName.KINDAPPER,
					RoleName.DOCTOR,
					RoleName.MAFIOSO,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleName.KINDAPPER);
			const doctor_player = mock_game.player_manager.get(RoleName.DOCTOR);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.KIDNAP), {
				[AbilityArgName.PLAYER_KIDNAPPING]: doctor_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect( doctor_player.feedback.includes(Feedback.KIDNAPPED) )
			.toBe(true);

			expect( doctor_player.feedback.includes(
				Feedback.ROLEBLOCKED_BY_KIDNAPPER
			) )
			.toBe(true);

			expect( kidnapper_player.feedback.includes(
				Feedback.KIDNAPPED_PLAYER(doctor_player)
			) )
			.toBe(true);

			expect(doctor_player.isRoleblocked).toBe(true);
			expect(doctor_player.defense).toBe(4);
			expect(doctor_player.isMuted).toBe(true);
			expect(doctor_player.canVote).toBe(false);

			expect(
				doctor_player.affected_by.some(affect => {
					return (
						affect.by === kidnapper_player.name &&
						affect.name === AbilityName.KIDNAP
					)
				})
			)
			.toBe(true);
		});

		it('SHOULD add attacked by kidnapped feedback to target and player and target attacks plater WHEN target has attack level', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.KINDAPPER,
					RoleName.VIGILANTE,
					RoleName.MAFIOSO,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleName.KINDAPPER);
			const vigilante_player = mock_game.player_manager.get(RoleName.VIGILANTE);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.KIDNAP), {
				[AbilityArgName.PLAYER_KIDNAPPING]: vigilante_player.name
			});

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
					Feedback.ATTACKED_KIDNAPPER
				)
			)
			.toBe(true);

			expect(
				kidnapper_player.feedback.includes(
					Feedback.ATTACK_BY_KIDNAPPED_PLAYER(vigilante_player)
				)
			)
			.toBe(true);
		});

		it('SHOULD not be roleblocked and recieve feedback WHEN target is immune to roleblocks', async () => {
			await RapidDiscordMafia.startMockGameWithRoles(
				mock_game,
				[
					RoleName.KINDAPPER,
					RoleName.ESCORT,
					RoleName.MAFIOSO,
				]
			);

			const kidnapper_player = mock_game.player_manager.get(RoleName.KINDAPPER);
			const escort_player = mock_game.player_manager.get(RoleName.ESCORT);

			await mock_game.startNight(mock_game.days_passed);

			kidnapper_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.KIDNAP), {
				[AbilityArgName.PLAYER_KIDNAPPING]: escort_player.name
			});

			await mock_game.setPhaseToNextPhase();
			await mock_game.performCurrentNightAbilities();

			expect(escort_player.isRoleblocked)
			.toBe(false);

			expect(
				escort_player.feedback.includes(
					Feedback.ROLEBLOCKED_BY_KIDNAPPER_BUT_IMMUNE
				)
			)
			.toBe(true);
		});
	});
});