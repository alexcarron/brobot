const { Phases, Subphases, GameStates } = require("../enums");
const Logger = require("./Logger");

/**
 * A class to handle the game's phases and state and manage it's logic
 */
class GameStateManager {
	/**
	 * @param {Game} game - The game's current instance
	 * @param {Logger} logger
	 */
	constructor(game, logger) {
		this.game = game;
		this.logger = logger;
	}

	static NIGHT_PHASE_LENGTH = 0.5;
	static DAY_PHASE_LENGTH = 0.5;
	static DAY_LENGTH = 1;

	/**
	 * The current phase the game is in
	 * @type {Phases}
	 */
	get phase() {
		this.game.phase;
	}
	set phase(phase) {
		this.game.phase = phase
	}

	/**
	 * The current subphase the game is in
	 * @type {Subphases}
	 */
	get subphase() {
		return this.game.subphase;
	}
	set subphase(subphase) {
		this.game.subphase = subphase
	}

	/**
	 * The current state the game is in
	 * @type {GameStates}
	 */
	get state() {
		return this.game.state;
	}
	set state(state) {
		this.game.state = state
	}

	/**
	 * The number of days that have passed in the game
	 * @type {number}
	 */
	get days_passed() {
		return this.game.days_passed;
	}
	set days_passed(days_passed) {
		this.game.days_passed = days_passed
	}

	/**
	 * The number day the game is on
	 * @type {number} integer
	 */
	get day_num() {
		return Math.ceil(this.days_passed);
	}

	/**
	 * Sets the initial state and phase of a game when a game is constructed but no started
	 */
	initializeState() {
		this.logger.log("Initializing game state");

		this.state = GameStates.Ended;
		this.phase = Phases.None;
		this.subphase = Subphases.None;
		this.days_passed = 0;

		console.log(this.game);
	}

	/**
	 * Sets the state and phase of the game when game is officially started
	 */
	changeToStarted() {
		this.logger.log("Changing game state to started");

		this.state = GameStates.InProgress;
		this.phase = Phases.None;
		this.subphase = Phases.None;
		this.days_passed = 0;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to the first day in the game
	 */
	setToFirstDay() {
		this.logger.logSubheading("Setting game phase to first day");

		this.phase = Phases.Day;
		this.subphase = Subphases.None;
		this.days_passed += GameStateManager.DAY_PHASE_LENGTH;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to day and updates number of days passed
	 */
	setToDay() {
		this.logger.logSubheading("Setting game phase to day");

		this.phase = Phases.Day;
		this.subphase = Subphases.Announcements;
		this.days_passed += GameStateManager.DAY_PHASE_LENGTH;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to voting
	 */
	setToVoting() {
		this.logger.logSubheading("Setting game phase to voting");

		this.phase = Phases.Day;
		this.subphase = Subphases.Voting;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to trial
	 */
	setToTrial() {
		this.logger.logSubheading("Setting game phase to trial");

		this.phase = Phases.Day;
		this.subphase = Subphases.Trial;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to trial results
	 */
	setToTrialResults() {
		this.logger.logSubheading("Setting game phase to trial results");

		this.phase = Phases.Day;
		this.subphase = Subphases.TrialResults;
		console.log(this.game);
	}

	/**
	 * Sets the game phase and subphase to night and updates number of days passed
	 */
	setToNight() {
		this.logger.logSubheading("Setting game phase to night");

		this.phase = Phases.Night;
		this.subphase = Subphases.None;
		this.days_passed += GameStateManager.NIGHT_PHASE_LENGTH;
		console.log(this.game);
	}

	/**
	 * Changes the phase and subphase of the game to the next subphase, also incrementing the day count
	 */
	changeToNextSubphase() {
		this.logger.log("Changing game phase to next subphase");

		switch (this.phase) {
			case Phases.Day:
				switch (this.subphase) {
					case Subphases.Announcements:
						this.setToVoting();
						break;

					case Subphases.Voting:
						this.setToTrial();
						break;

					case Subphases.Trial:
						this.setToTrialResults();
						break;

					case Subphases.TrialResults:
					default:
						this.setToNight();
						break;
				}
				break;

			case Phases.Night:
				this.setToDay();
				break;

			default:
				this.setToFirstDay();
				break;
		}
	}

	/**
	 * Get whether or not the game is in the announcements phase
	 * @returns {boolean}
	 */
	isInAnnouncementsPhase() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Announcements
		)
	}

	/**
	 * Checks if it is just before the first day, indicating readiness to start first day.
	 * @returns {boolean} True if it's just before the first day, otherwise false.
	 */
	canStartFirstDay() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.None &&
			this.days_passed === 0
		)
	}
}

module.exports = GameStateManager;