const { Phases, Subphases, GameStates } = require("../enums");
const Logger = require("./Logger");

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
		this.game.logger.log("Initializing game state");

		this.state = GameStates.Ended;
		this.phase = Phases.None;
		this.subphase = Subphases.None;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially in sign ups
	 */
	changeToSignUps() {
		this.game.logger.log("Changing game state to sign ups");

		this.state = GameStates.SignUp;
		this.phase = Phases.None;
		this.subphase = Phases.None;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially ready to start
	 */
	changeToReadyToStart() {
		this.game.logger.log("Changing game state to ready to start");

		this.state = GameStates.ReadyToBegin;
		this.phase = Phases.None;
		this.subphase = Phases.None;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially started
	 */
	changeToStarted() {
		this.game.logger.log("Changing game state to started");

		this.state = GameStates.InProgress;
		this.phase = Phases.None;
		this.subphase = Phases.None;
		this.days_passed = 0;
	}

	/**
	 * Changes the state and phase of the game when game is officially over
	 */
	changeToEnded() {
		this.game.logger.log("Changing game state to be ended");

		this.state = GameStates.Ended;
		this.phase = Phases.None;
		this.subphase = Phases.None;
	}

	/**
	 * Sets the game phase and subphase to the first day in the game
	 */
	setToFirstDay() {
		this.game.logger.logSubheading("Setting game phase to first day");

		this.phase = Phases.Day;
		this.subphase = Subphases.None;
		this.days_passed = GameStateManager.DAY_PHASE_LENGTH;
	}

	/**
	 * Sets the game phase and subphase to day and updates number of days passed
	 */
	setToDay() {
		this.game.logger.logSubheading("Setting game phase to day");

		this.phase = Phases.Day;
		this.subphase = Subphases.Announcements;
		this.days_passed += GameStateManager.DAY_PHASE_LENGTH;
	}

	/**
	 * Sets the game phase and subphase to voting
	 */
	setToVoting() {
		this.game.logger.logSubheading("Setting game phase to voting");

		this.phase = Phases.Day;
		this.subphase = Subphases.Voting;
	}

	/**
	 * Sets the game phase and subphase to trial
	 */
	setToTrial() {
		this.game.logger.logSubheading("Setting game phase to trial");

		this.phase = Phases.Day;
		this.subphase = Subphases.Trial;
	}

	/**
	 * Sets the game phase and subphase to trial results
	 */
	setToTrialResults() {
		this.game.logger.logSubheading("Setting game phase to trial results");

		this.phase = Phases.Day;
		this.subphase = Subphases.TrialResults;
	}

	/**
	 * Sets the game phase and subphase to night and updates number of days passed
	 */
	setToNight() {
		this.game.logger.logSubheading("Setting game phase to night");

		this.phase = Phases.Night;
		this.subphase = Subphases.None;
		this.days_passed += GameStateManager.NIGHT_PHASE_LENGTH;
	}

	/**
	 * Changes the phase and subphase of the game to the next subphase, also incrementing the day count
	 */
	changeToNextSubphase() {
		this.game.logger.log("Changing game phase to next subphase");

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
	 * Get whether or not the game is in the voting phase
	 * @returns {boolean}
	 */
	isInVotingPhase() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Voting
		)
	}

	/**
	 * Get whether or not the game is in the trial phase
	 * @returns {boolean}
	 */
	isInTrialPhase() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.Trial
		)
	}

	/**
	 * Get whether or not the game is in the trial results phase
	 * @returns {boolean}
	 */
	isInTrialResultsPhase() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.TrialResults
		)
	}

	/**
	 * Get whether or not the game is in the night phase
	 * @returns {boolean}
	 */
	isInNightPhase() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Night &&
			this.subphase === Subphases.None
		)
	}

	/**
	 * Get whether or not it's currently the first day of the game
	 * @returns {boolean}
	 */
	isFirstDay() {
		return (
			this.state === GameStates.InProgress &&
			this.phase === Phases.Day &&
			this.subphase === Subphases.None &&
			this.days_passed === GameStateManager.DAY_PHASE_LENGTH
		)
	}

	/**
	 * Get whether or not the game is in sign ups
	 * @returns {boolean}
	 */
	isInSignUps() {
		return (
			this.state === GameStates.SignUp &&
			this.phase === Phases.None &&
			this.subphase === Subphases.None
		)
	}

	/**
	 * Get whether or not the game is ready to start
	 * @returns {boolean}
	 */
	isReadyToStart() {
		return (
			this.state === GameStates.ReadyToBegin &&
			this.phase === Phases.None &&
			this.subphase === Subphases.None
		)
	}

	/**
	 * Get whether or not the game ended
	 * @returns {boolean}
	 */
	isEnded() {
		return (
			this.state === GameStates.Ended &&
			this.phase === Phases.None &&
			this.subphase === Subphases.None
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
			this.subphase === Subphases.None &&
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
		this.logCurrentState();
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

module.exports = GameStateManager;