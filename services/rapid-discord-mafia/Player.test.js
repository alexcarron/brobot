const { RoleNames, AbilityArgName } = require("../../modules/enums");
const RapidDiscordMafia = require("./RapidDiscordMafia");
const { RoleIdentifier } = require("./RoleIdentifier");
const RoleManager = require("./RoleManager");
const GameManager = require("./GameManager");
const { AbilityName } = require("./Ability");

describe('Player', () => {
	/**
	 * @type Game
	 */
	let mock_game;

  const setupMockGame = () => {
		RapidDiscordMafia.setUpRapidDiscordMafia(true);
		mock_game = global.game_manager;
  };

  beforeEach(() => {
    setupMockGame();
  });

	// ^ removeAffects
	describe('removeAffects', () => {
		it('SHOULD remove kidnapped affect entry from affected_by property of player given a night and day has passed', async () => {
			expect(mock_game.isMockGame).toBe(true);

			let mafioso_name = RoleNames.Mafioso
			let mafioso_player = await mock_game.addPlayerToGame(mafioso_name);

			let kidnapper_name = RoleNames.Kidnapper
			let kidnapper_player = await mock_game.addPlayerToGame(kidnapper_name);

			let doctor_name = RoleNames.Doctor;
			let doctor_player = await mock_game.addPlayerToGame(doctor_name);

			const role_identifiers = RoleIdentifier.convertIdentifierStrings([
				RoleNames.Doctor,
				RoleNames.Kidnapper,
				RoleNames.Mafioso,
			]);

			await mock_game.start(role_identifiers);

			const mafioso_role = RoleManager.roles[RoleNames.Mafioso];
			const kidnapper_role = RoleManager.roles[RoleNames.Kidnapper];
			const doctor_role = RoleManager.roles[RoleNames.Doctor];
5
			// Fix role not being set right
			kidnapper_player.setRole(kidnapper_role);
			doctor_player.setRole(doctor_role);
			mafioso_player.setRole(mafioso_role);

			await mock_game.startNight(mock_game.days_passed);

			const feedback = kidnapper_player.useAbility(
				mock_game.ability_manager.getAbility(AbilityName.KIDNAP),
				{ [AbilityArgName.PlayerKidnapping]: doctor_name },
			);
			console.log({feedback})

			await mock_game.startDay(mock_game.days_passed);

			// Should Apply effects
			expect(doctor_player.defense).toBe(4);
			expect(doctor_player.isRoleblocked).toBe(true);
			expect(doctor_player.isMuted).toBe(true);
			expect(doctor_player.canVote).toBe(false);

			await mock_game.startTrial(mock_game.days_passed);
			// Skips to night because no vote

			// Kidnapping effects SHOULD be reversed
			expect(doctor_player.defense).toBe(0);
			expect(doctor_player.isRoleblocked).toBe(false);
			expect(doctor_player.isMuted).toBe(false);
			expect(doctor_player.canVote).toBe(true);

			const isAffectedByKidnap =
				doctor_player.affected_by.some((affect) => {
					affect.name === AbilityName.KIDNAP;
				});

			expect(isAffectedByKidnap).toBe(false);
		});
	});
})