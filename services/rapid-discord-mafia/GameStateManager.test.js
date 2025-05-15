const {GameStateManager, Phase, Subphase, GameState} = require("./GameStateManager");
const RapidDiscordMafia = require("./RapidDiscordMafia");

describe('GameStateManager', () => {
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

	describe('getters', () => {
		it('SHOULD return game\'s state, phase, subphase, and days_passed', () => {
			mock_game.phase = Phase.LIMBO;
			mock_game.subphase = Subphase.TRAIL_RESULTS;
			mock_game.state = GameState.READY_TO_START;
			mock_game.days_passed = 12.5;

			expect(mock_game.state_manager.phase).toBe(mock_game.phase);
			expect(mock_game.state_manager.subphase).toBe(mock_game.subphase);
			expect(mock_game.state_manager.state).toBe(mock_game.state);
			expect(mock_game.state_manager.days_passed).toBe(mock_game.days_passed);
		});
	});

	describe('setters', () => {
		it('SHOULD set game\'s state, phase, subphase, and days_passed', () => {
			mock_game.state_manager.phase = Phase.LIMBO;
			mock_game.state_manager.subphase = Subphase.TRAIL_RESULTS;
			mock_game.state_manager.state = GameState.READY_TO_START;
			mock_game.state_manager.days_passed = 12.5;

			expect(mock_game.phase).toBe(Phase.LIMBO);
			expect(mock_game.subphase).toBe(Subphase.TRAIL_RESULTS);
			expect(mock_game.state).toBe(GameState.READY_TO_START);
			expect(mock_game.days_passed).toBe(12.5);
		});
	});

	describe('changeToNextSubphase', () => {
		it('SHOULD set phase to day announcements WHEN it is night', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToNight();
			mock_game.state_manager.changeToNextSubphase();

			expect(mock_game.state_manager.isInAnnouncementsPhase()).toBe(true)
		});

		it('SHOULD set phase to day voting WHEN it is day announcements', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToDay();
			mock_game.state_manager.changeToNextSubphase();

			expect(mock_game.state_manager.isInVotingPhase()).toBe(true)
		});

		it('SHOULD set phase to day trial WHEN it is day voting', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToVoting();
			mock_game.state_manager.changeToNextSubphase();

			expect(mock_game.state_manager.isInTrialPhase()).toBe(true)
		});

		it('SHOULD set phase to day trial results WHEN it is day trial', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToTrial();
			mock_game.state_manager.changeToNextSubphase();

			expect(mock_game.state_manager.isInTrialResultsPhase()).toBe(true)
		});

		it('SHOULD set phase to night WHEN it is day trial results', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToTrialResults();
			mock_game.state_manager.changeToNextSubphase();

			expect(mock_game.state_manager.isInNightPhase()).toBe(true)
		});
	});

	describe('setToFirstDay', () => {
		it('SHOULD set game state to first day', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.setToFirstDay();
			expect(mock_game.state_manager.isFirstDay()).toBe(true);
		});
	});

	describe('changeToSignUps', () => {
		it('SHOULD set game state to sign ups', () => {
			mock_game.state_manager.changeToSignUps();
			expect(mock_game.state_manager.isInSignUps()).toBe(true);
		});
	});

	describe('changeToReadyToStart', () => {
		it('SHOULD set game state to ready to start', () => {
			mock_game.state_manager.changeToReadyToStart();
			expect(mock_game.state_manager.isReadyToStart()).toBe(true);
		});
	});

	describe('changeToEnded', () => {
		it('SHOULD set game state to ended', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.changeToEnded();
			expect(mock_game.state_manager.isEnded()).toBe(true);
		});
	});

	describe('canStartFirstDay', () => {
		it('SHOULD return yes only WHEN just before first day and on day 0', () => {
			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.NONE;
			mock_game.state_manager.subphase = Subphase.NONE;
			mock_game.state_manager.days_passed = 0;
			expect(mock_game.state_manager.canStartFirstDay()).toBe(true);

			mock_game.state_manager.phase = Phase.NIGHT;
			expect(mock_game.state_manager.canStartFirstDay()).toBe(false);


			mock_game.state_manager.phase = Phase.NONE;
			mock_game.state_manager.subphase = Subphase.TRAIL_RESULTS;
			expect(mock_game.state_manager.canStartFirstDay()).toBe(false);

			mock_game.state_manager.subphase = Subphase.NONE;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartFirstDay()).toBe(false);

			mock_game.state_manager.days_passed = 0;
			expect(mock_game.state_manager.canStartFirstDay()).toBe(true);
		});
	});

	describe('canStartDay', () => {
		it('SHOULD return yes only WHEN just before that day and called on the same day', () => {
			day_wanting_to_start = 1.5;
			day_last_subphase_ended = 1;

			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.NIGHT;
			mock_game.state_manager.subphase = Subphase.NONE;
			mock_game.state_manager.days_passed = day_last_subphase_ended;
			expect(mock_game.state_manager.canStartDay(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.phase = Phase.DAY;
			expect(mock_game.state_manager.canStartDay(day_last_subphase_ended)).toBe(false);


			mock_game.state_manager.phase = Phase.NIGHT;
			mock_game.state_manager.subphase = Subphase.ANNOUNCEMENTS;
			expect(mock_game.state_manager.canStartDay(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.subphase = Subphase.NONE;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartDay(day_last_subphase_ended)).toBe(false);
		});
	});

	describe('canStartVoting', () => {
		it('SHOULD return yes only WHEN just before that subphase and called on the same day', () => {
			day_wanting_to_start = 1.5;
			day_last_subphase_ended = 1.5;

			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.ANNOUNCEMENTS;
			mock_game.state_manager.days_passed = day_last_subphase_ended;
			expect(mock_game.state_manager.canStartVoting(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.phase = Phase.NIGHT;
			expect(mock_game.state_manager.canStartVoting(day_last_subphase_ended)).toBe(false);


			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.VOTING;
			expect(mock_game.state_manager.canStartVoting(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.subphase = Subphase.ANNOUNCEMENTS;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartVoting(day_last_subphase_ended)).toBe(false);
		});
	});

	describe('canStartTrial', () => {
		it('SHOULD return yes only WHEN just before that subphase and called on the same day', () => {
			day_wanting_to_start = 1.5;
			day_last_subphase_ended = 1.5;

			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.VOTING;
			mock_game.state_manager.days_passed = day_last_subphase_ended;
			expect(mock_game.state_manager.canStartTrial(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.phase = Phase.NIGHT;
			expect(mock_game.state_manager.canStartTrial(day_last_subphase_ended)).toBe(false);


			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.ANNOUNCEMENTS;
			expect(mock_game.state_manager.canStartTrial(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.subphase = Subphase.VOTING;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartTrial(day_last_subphase_ended)).toBe(false);
		});
	});

	describe('canStartTrialResults', () => {
		it('SHOULD return yes only WHEN just before that subphase and called on the same day', () => {
			day_wanting_to_start = 1.5;
			day_last_subphase_ended = 1.5;

			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.TRIAL;
			mock_game.state_manager.days_passed = day_last_subphase_ended;
			expect(mock_game.state_manager.canStartTrialResults(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.phase = Phase.NIGHT;
			expect(mock_game.state_manager.canStartTrialResults(day_last_subphase_ended)).toBe(false);


			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.VOTING;
			expect(mock_game.state_manager.canStartTrialResults(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.subphase = Subphase.TRIAL;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartTrialResults(day_last_subphase_ended)).toBe(false);
		});
	});

	describe('canStartNight', () => {
		it('SHOULD return yes only WHEN just before that subphase and called on the same day', () => {
			day_wanting_to_start = 1.5;
			day_last_subphase_ended = 1.5;

			mock_game.state_manager.changeToStarted();
			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.TRAIL_RESULTS;
			mock_game.state_manager.days_passed = day_last_subphase_ended;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.subphase = Subphase.TRIAL;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.subphase = Subphase.NONE;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.setToFirstDay();
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(false);

			day_last_subphase_ended = mock_game.state_manager.days_passed;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(true);

			mock_game.state_manager.phase = Phase.NIGHT;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(false);


			mock_game.state_manager.phase = Phase.DAY;
			mock_game.state_manager.subphase = Subphase.VOTING;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(false);

			mock_game.state_manager.subphase = Subphase.TRAIL_RESULTS;
			mock_game.state_manager.days_passed += GameStateManager.DAY_LENGTH;
			expect(mock_game.state_manager.canStartNight(day_last_subphase_ended)).toBe(false);
		});
	});
});