/**
 * Enum of possible phases of the game
 */
const Phase = Object.freeze({
	DAY: "day",
	NIGHT: "night",
	VOTING: "voting",
	TRIAL: "trial",
	LIMBO: "limbo",
	NONE: null,
});

/**
 * Enum of length of game phases in minutes
 */
const PhaseLength = Object.freeze({
	FIRST_DAY: 2,
	NIGHT: 5,
	SIGN_UPS: 15,
	VOTING: 7,
	TRIAL: 5,
});

/**
 * Enum of possible subphases of the game
 */
const Subphase = Object.freeze({
	ANNOUNCEMENTS: "announcements",
	VOTING: "voting",
	TRIAL: "trial",
	TRAIL_RESULTS: "results",
	NONE: null,
});

/**
 * Enums of possible states of the game
 */
const GameState = Object.freeze({
	SIGN_UP: "sign-up",
	READY_TO_START: "ready",
	IN_PROGRESS: "in progress",
	ENDED: "ended",
});

/**
 * A class to handle the game's phases and state and manage it's logic
 */
class GameStateManager {
	/**
	 * @param {Game} game - The game's current instance
	 */
	constructor(game) {
		this.game = game;
	}

	static NIGHT_PHASE_LENGTH = 0.5;
	static DAY_PHASE_LENGTH = 0.5;
	static DAY_LENGTH = 1;

	/**
	 * The current phase the game is in
	 * @type {Phases}
	 */
	get phase() {
		return this.game.phase;
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
		this.state = GameState.ENDED;
		this.phase = Phase.NONE;
		this.subphase = Subphase.NONE;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially in sign ups
	 */
	changeToSignUps() {
		this.game.logger.log("Changing game state to sign ups");

		this.state = GameState.SIGN_UP;
		this.phase = Phase.NONE;
		this.subphase = Phase.NONE;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially ready to start
	 */
	changeToReadyToStart() {
		this.game.logger.log("Changing game state to ready to start");

		this.state = GameState.READY_TO_START;
		this.phase = Phase.NONE;
		this.subphase = Phase.NONE;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially started
	 */
	changeToStarted() {
		this.game.logger.log("Changing game state to started");

		this.state = GameState.IN_PROGRESS;
		this.phase = Phase.NONE;
		this.subphase = Phase.NONE;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially over
	 */
	changeToEnded() {
		this.game.logger.log("Changing game state to be ended");

		this.state = GameState.ENDED;
		this.phase = Phase.NONE;
		this.subphase = Phase.NONE;
	}

	/**
	 * Sets the game phase and subphase to the first day in the game
	 */
	setToFirstDay() {
		this.game.logger.logSubheading("Setting game phase to first day");

		this.phase = Phase.DAY;
		this.subphase = Subphase.NONE;
		this.days_passed = GameStateManager.DAY_PHASE_LENGTH;
	}

	/**
	 * Sets the game phase and subphase to day and updates number of days passed
	 */
	setToDay() {
		this.game.logger.logSubheading("Setting game phase to day");

		this.phase = Phase.DAY;
		this.subphase = Subphase.ANNOUNCEMENTS;
		this.days_passed += GameStateManager.DAY_PHASE_LENGTH;
	}

	/**
	 * Sets the game phase and subphase to voting
	 */
	setToVoting() {
		this.game.logger.logSubheading("Setting game phase to voting");

		this.phase = Phase.DAY;
		this.subphase = Subphase.VOTING;
	}

	/**
	 * Sets the game phase and subphase to trial
	 */
	setToTrial() {
		this.game.logger.logSubheading("Setting game phase to trial");

		this.phase = Phase.DAY;
		this.subphase = Subphase.TRIAL;
	}

	/**
	 * Sets the game phase and subphase to trial results
	 */
	setToTrialResults() {
		this.game.logger.logSubheading("Setting game phase to trial results");

		this.phase = Phase.DAY;
		this.subphase = Subphase.TRAIL_RESULTS;
	}

	/**
	 * Sets the game phase and subphase to night and updates number of days passed
	 */
	setToNight() {
		this.game.logger.logSubheading("Setting game phase to night");

		this.phase = Phase.NIGHT;
		this.subphase = Subphase.NONE;
		this.days_passed += GameStateManager.NIGHT_PHASE_LENGTH;
	}

	/**
	 * Changes the phase and subphase of the game to the next subphase, also incrementing the day count
	 */
	changeToNextSubphase() {
		this.game.logger.log("Changing game phase to next subphase");

		switch (this.phase) {
			case Phase.DAY:
				switch (this.subphase) {
					case Subphase.ANNOUNCEMENTS:
						this.setToVoting();
						break;

					case Subphase.VOTING:
						this.setToTrial();
						break;

					case Subphase.TRIAL:
						this.setToTrialResults();
						break;

					case Subphase.TRAIL_RESULTS:
					default:
						this.setToNight();
						break;
				}
				break;

			case Phase.NIGHT:
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
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.DAY &&
			this.subphase === Subphase.ANNOUNCEMENTS
		)
	}

	/**
	 * Get whether or not the game is in the voting phase
	 * @returns {boolean}
	 */
	isInVotingPhase() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.DAY &&
			this.subphase === Subphase.VOTING
		)
	}

	/**
	 * Get whether or not the game is in the trial phase
	 * @returns {boolean}
	 */
	isInTrialPhase() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.DAY &&
			this.subphase === Subphase.TRIAL
		)
	}

	/**
	 * Get whether or not the game is in the trial results phase
	 * @returns {boolean}
	 */
	isInTrialResultsPhase() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.DAY &&
			this.subphase === Subphase.TRAIL_RESULTS
		)
	}

	/**
	 * Get whether or not the game is in the night phase
	 * @returns {boolean}
	 */
	isInNightPhase() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.NIGHT &&
			this.subphase === Subphase.NONE
		)
	}

	/**
	 * Get whether or not it's currently the first day of the game
	 * @returns {boolean}
	 */
	isFirstDay() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.DAY &&
			this.subphase === Subphase.NONE &&
			this.days_passed === GameStateManager.DAY_PHASE_LENGTH
		)
	}

	/**
	 * Get whether or not the game is in sign ups
	 * @returns {boolean}
	 */
	isInSignUps() {
		return (
			this.state === GameState.SIGN_UP &&
			this.phase === Phase.NONE &&
			this.subphase === Subphase.NONE
		)
	}

	/**
	 * Get whether or not the game is ready to start
	 * @returns {boolean}
	 */
	isReadyToStart() {
		return (
			this.state === GameState.READY_TO_START &&
			this.phase === Phase.NONE &&
			this.subphase === Subphase.NONE
		)
	}

	/**
	 * Get whether or not the game ended
	 * @returns {boolean}
	 */
	isEnded() {
		return (
			this.state === GameState.ENDED &&
			this.phase === Phase.NONE &&
			this.subphase === Subphase.NONE
		)
	}

	/**
	 * Checks if it is just before the first day, indicating readiness to start first day.
	 * @returns {boolean} True if it's just before the first day, otherwise false.
	 */
	canStartFirstDay() {
		return (
			this.state === GameState.IN_PROGRESS &&
			this.phase === Phase.NONE &&
			this.subphase === Subphase.NONE &&
			this.days_passed === 0
		)
	}

	/**
	 * Checks if it is just before a specific day phase, indicating readiness to start that day.
	 * @param {number | undefined} day_night_before_ended - The amount of days that passed when the night before that specific day phase ended. Undefined if impossible to determine.
	 * @returns {boolean} True if it's just before that specific day phase, otherwise false.
	 */
	canStartDay(day_night_before_ended) {
		if (day_night_before_ended === undefined)
			return true;

		return (
			this.isInNightPhase() &&
			this.days_passed === day_night_before_ended
		)
	}

	/**
	 * Checks if it is just before a specific voting subphase, indicating readiness to start that subphase.
	 * @param {number | undefined} day_this_day_started - The amount of days that passed when the day that specific voting subphase is in started. Undefined if impossible to determine.
	 * @returns {boolean} True if it's just before that specific voting subphase, otherwise false.
	 */
	canStartVoting(day_this_day_started) {
		if (day_this_day_started === undefined)
			return true;

		return (
			this.isInAnnouncementsPhase() &&
			this.days_passed === day_this_day_started
		)
	}

	/**
	 * Checks if it is just before a specific trial subphase, indicating readiness to start that subphase.
	 * @param {number | undefined} day_voting_subphase_before_ended - The amount of days that passed when the voting subphase before this specific trial subphase ended. Undefined if impossible to determine.
	 * @returns {boolean} True if it's just before that specific trial subphase, otherwise false.
	 */
	canStartTrial(day_voting_subphase_before_ended) {
		if (day_voting_subphase_before_ended === undefined)
			return true;

		return (
			this.isInVotingPhase() &&
			this.days_passed === day_voting_subphase_before_ended
		)
	}

	/**
	 * Checks if it is just before a specific trial results subphase, indicating readiness to start that subphase.
	 * @param {number | undefined} day_trial_subphase_before_ended - The amount of days that passed when the trial subphase before this specific trial results subphase ended. Undefined if impossible to determine.
	 * @returns {boolean} True if it's just before that specific trial results subphase, otherwise false.
	 */
	canStartTrialResults(day_trial_subphase_before_ended) {
		if (day_trial_subphase_before_ended === undefined)
			return true;

		return (
			this.isInTrialPhase() &&
			this.days_passed === day_trial_subphase_before_ended
		)
	}

	/**
	 * Checks if it is just before a specific night phase, indicating readiness to start that phase.
	 * @param {number | undefined} day_the_day_before_ended - The amount of days that passed when the day phase before this specific night phase ended. Undefined if impossible to determine.
	 * @returns {boolean} True if it's just before that specific night phase, otherwise false.
	 */
	canStartNight(day_the_day_before_ended) {
		if (day_the_day_before_ended === undefined)
			return true;

		return (
			(
				this.isInTrialResultsPhase() ||
				this.isInTrialPhase() || // Town voting nobody
				this.isFirstDay()
			)
			&&
			this.days_passed === day_the_day_before_ended
		)
	}


	logCurrentState() {
		this.game.logger.log({
			state: this.state,
			phase: this.phase,
			subphase: this.subphase,
			days_passed: this.days_passed,
		})
	}
}

module.exports = { GameStateManager, Phase, Subphase, GameState, PhaseLength };