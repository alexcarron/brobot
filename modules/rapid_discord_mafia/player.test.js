const { RoleNames, AbilityName: AbilityName, AbilityArgName } = require("../enums");
const RapidDiscordMafia = require("./RapidDiscordMafia");
const RoleIdentifier = require("./RoleIdentifier");
const Game = require("./game");
const Player = require("./player");
const Players = require("./players");

describe('Player', () => {
	/**
	 * @type Game
	 */
	let mock_game;

  const setupMockGame = () => {
		RapidDiscordMafia.setUpRapidDiscordMafia(true);
		mock_game = global.Game;
  };

  beforeEach(() => {
    setupMockGame();
  });

	// ^ removeAffects
	describe('removeAffects', () => {
		it('should remove kidnapped affect entry from affected_by property of player given a night and day has passed', async () => {
			expect(mock_game.isMockGame).toBe(true);

			let mafioso_name = RoleNames.Mafioso
			let mafioso_player = await mock_game.addPlayerToGame(mafioso_name);

			let kidnapper_name = RoleNames.Kidnapper
			let kidnapper_player = await mock_game.addPlayerToGame(kidnapper_name);

			let townie_name = RoleNames.Townie;
			let townie_player = await mock_game.addPlayerToGame(townie_name);

			const role_identifiers = RoleIdentifier.convertIdentifierStrings([
				RoleNames.Townie,
				RoleNames.Kidnapper,
				RoleNames.Mafioso,
			]);

			await mock_game.start(role_identifiers);

			const mafioso_role = global.Roles[RoleNames.Mafioso];
			const kidnapper_role = global.Roles[RoleNames.Kidnapper];
			const townie_role = global.Roles[RoleNames.Townie];

			// Fix role not being set right
			kidnapper_player.setRole(kidnapper_role);
			townie_player.setRole(townie_role);
			mafioso_player.setRole(mafioso_role);

			await mock_game.startNight(mock_game.days_passed);

			const feedback = kidnapper_player.useAbility(
				AbilityName.Kidnap,
				{ [AbilityArgName.PlayerKidnapping]: townie_name }
			);
			console.log({feedback})

			await mock_game.startDay(mock_game.days_passed);

			// Should Apply effects
			expect(townie_player.defense).toBe(4); // ! FAILED
			expect(townie_player.isRoleblocked).toBe(true);
			expect(townie_player.isMuted).toBe(true);
			expect(townie_player.canVote).toBe(false);

			await mock_game.startTrial(mock_game.days_passed);
			// Skips to night because no vote

			// Kidnapping effects should be reversed
			expect(townie_player.defense).toBe(0);
			expect(townie_player.isRoleblocked).toBe(false);
			expect(townie_player.isMuted).toBe(false);
			expect(townie_player.canVote).toBe(true);

			const isAffectedByKidnap =
				townie_player.affected_by.some((affect) => {
					affect.name === AbilityName.Kidnap;
				});

			expect(isAffectedByKidnap).toBe(false);
		});
	});
})