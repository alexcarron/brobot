const { RoleNames, AbilityName, AbilityArgName, Feedback } = require("../enums");
const RapidDiscordMafia = require("./RapidDiscordMafia");
const Game = require("./game");
const perform = require("./perform");

describe('perform', () => {
	/**
	 * @type Game
	 */
	let mock_game;

  const setupMockGame = () => {
		RapidDiscordMafia.setUpRapidDiscordMafia(true);
		if (global.Game instanceof Game)
			mock_game = global.Game;
  };

  beforeEach(() => {
    setupMockGame();
  });

	// ^ track
	describe('track', () => {
		it('should not give feedback when tracked player visits self', async () => {
			let doctor_player = await mock_game.addPlayerToGame(RoleNames.Doctor);
			let tracker_player = await mock_game.addPlayerToGame(RoleNames.Tracker);

			const doctor_role = global.Roles[RoleNames.Doctor];
			const tracker_role = global.Roles[RoleNames.Tracker];

			doctor_player.setRole(doctor_role);
			tracker_player.setRole(tracker_role);

			doctor_player.useAbility(
				AbilityName.HealSelf,
				{}
			);

			tracker_player.useAbility(
				AbilityName.Track,
				{
					[AbilityArgName.PlayerTracking]: doctor_player.name
				}
			)

			await perform.selfHeal({
				by: doctor_player.name,
				name: AbilityName.HealSelf,
			});

			await perform.track({
				by: tracker_player.name,
				name: AbilityName.Track,
				args: {
					[AbilityArgName.PlayerTracking]: doctor_player.name
				}
			});

			const tracker_feedback = tracker_player.feedback;
			const canSeeDoctorVisitSelf = tracker_feedback.some(
				feedback =>
					feedback.includes(Feedback.TrackerSawPlayerVisit(doctor_player.name, doctor_player.name))
			)

			expect(canSeeDoctorVisitSelf).toBe(false);
		});
	});

	// ^ lookout
	describe('lookout', () => {
		it('should not give feedback when a target player visits self', async () => {
			let doctor_player = await mock_game.addPlayerToGame(RoleNames.Doctor);
			let lookout_player = await mock_game.addPlayerToGame(RoleNames.Lookout);

			const doctor_role = global.Roles[RoleNames.Doctor];
			const lookout_role = global.Roles[RoleNames.Lookout];

			doctor_player.setRole(doctor_role);
			lookout_player.setRole(lookout_role);

			doctor_player.useAbility(
				AbilityName.HealSelf,
				{}
			);

			lookout_player.useAbility(
				AbilityName.Lookout,
				{
					[AbilityArgName.PlayerWatching]: doctor_player.name
				}
			)

			await perform.selfHeal({
				by: doctor_player.name,
				name: AbilityName.HealSelf,
			});

			await perform.track({
				by: lookout_player.name,
				name: AbilityName.Lookout,
				args: {
					[AbilityArgName.PlayerWatching]: doctor_player.name
				}
			});

			const lookout_feedback = lookout_player.feedback;
			console.log({lookout_feedback});
			const canSeeDoctorVisitSelf = lookout_feedback.some(
				feedback =>
					feedback.includes(Feedback.LookoutSeesVisits(doctor_player.name, [doctor_player.name]))
			)

			expect(canSeeDoctorVisitSelf).toBe(false);
		});
	});
})