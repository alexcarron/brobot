import DatabaseQuerier from "../database/database-querier";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { DBGameState } from "../types/gameState.types";

/**
 * Provides access to the game state data.
 */
export class GameStateRepository {
	db: DatabaseQuerier;

	/**
	 * @param {DatabaseQuerier} db - The database querier instance used for executing SQL statements.
	 */
	constructor(db) {
		if (!(db instanceof DatabaseQuerier))
			throw new InvalidArgumentError("CharacterRepository: db must be an instance of DatabaseQuerier.");

		this.db = db;
	}

	/**
	 * Retrieves the current game state.
	 * @returns {{
	 * 	timeStarted: Date | undefined,
	 * 	timeEnding: Date | undefined,
	 * 	timeVoteIsEnding: Date | undefined,
	 * }} The current game state.
	 */
	getGameState() {
		const query = `
			SELECT timeStarted, timeEnding, timeVoteIsEnding
			FROM gameState
			WHERE id = 1
		`;

		const getGameState = this.db.prepare(query);
		const dbGameState = getGameState.get() as DBGameState;

		const timeStarted = dbGameState.timeStarted ?
			new Date(parseInt(dbGameState.timeStarted)) :
			undefined;

		const timeEnding = dbGameState.timeEnding ?
			new Date(parseInt(dbGameState.timeEnding)) :
			undefined;

		const timeVoteIsEnding = dbGameState.timeVoteIsEnding ?
			new Date(parseInt(dbGameState.timeVoteIsEnding)) :
			undefined;

		return {
			timeStarted,
			timeEnding,
			timeVoteIsEnding,
		};
	}

	/**
	 * Sets the current game state.
	 * @param gameState - The new game state.
	 * @throws If there are no fields provided to update.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setGameState({ timeStarted, timeEnding, timeVoteIsEnding }: {
		timeStarted?: Date;
		timeEnding?: Date;
		timeVoteIsEnding?: Date;
	}) {
		const assignmentExpressions = [];
		const fieldToValue: Record<string, string> = {};

		if (timeStarted !== undefined) {
			assignmentExpressions.push('timeStarted = @timeStarted');
			fieldToValue.timeStarted = timeStarted.getTime().toString();
		}
		if (timeEnding !== undefined) {
			assignmentExpressions.push('timeEnding = @timeEnding');
			fieldToValue.timeEnding = timeEnding.getTime().toString();
		}
		if (timeVoteIsEnding !== undefined) {
			assignmentExpressions.push('timeVoteIsEnding = @timeVoteIsEnding');
			fieldToValue.timeVoteIsEnding = timeVoteIsEnding.getTime().toString();
		}

		if (assignmentExpressions.length === 0)
			throw new InvalidArgumentError('setGameState: There are no fields provided to update.');

		const query = `
			UPDATE gameState
			SET ${assignmentExpressions.join(', ')}
			WHERE id = 1
		`;

		const setGameState = this.db.prepare(query);
		setGameState.run(fieldToValue);
	}

	/**
	 * Retrieves the time when the game started.
	 * @returns {Promise<Date>} The time when the game started.
	 */
	async getTimeStarted() {
		const gameState = await this.getGameState();
		return gameState.timeStarted;
	}

	/**
	 * Sets the time when the game started.
	 * @param {Date} timeStarted The time when the game started.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setTimeStarted(timeStarted: Date) {
		await this.setGameState({ timeStarted });
	}

	/**
	 * Retrieves the time when the game is expected to end.
	 * @returns {Promise<Date>} The time when the game is expected to end.
	 */
	async getTimeEnding() {
		const gameState = await this.getGameState();
		return gameState.timeEnding;
	}

	/**
	 * Sets the time when the game is expected to end.
	 * @param {Date} timeEnding - The time when the game is expected to end.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setTimeEnding(timeEnding) {
		await this.setGameState({ timeEnding });
	}

	/**
	 * Retrieves the time when the voting phase is expected to end.
	 * @returns {Promise<Date>} The time when the voting phase is expected to end.
	 */
	async getTimeVoteIsEnding() {
		const gameState = await this.getGameState();
		return gameState.timeVoteIsEnding;
	}

	/**
	 * Sets the time when the voting phase is expected to end.
	 * @param {Date} timeVoteIsEnding - The time when the voting phase is expected to end.
	 * @returns {Promise<void>} A promise that resolves once the change has been saved.
	 */
	async setTimeVoteIsEnding(timeVoteIsEnding) {
		await this.setGameState({ timeVoteIsEnding });
	}
}