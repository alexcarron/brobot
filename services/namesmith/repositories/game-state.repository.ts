import { DatabaseQuerier } from "../database/database-querier";
import { InvalidArgumentError } from "../../../utilities/error-utils";
import { asGameState, DefinedGameState, GameState, isGameStateDefined } from "../types/game-state.types";
import { WithAtLeastOneProperty } from '../../../utilities/types/generic-types';
import { GameStateInitializationError } from "../utilities/error.utility";
import { createMockDB } from "../mocks/mock-database";
import { DBDate } from "../utilities/db.utility";

/**
 * Provides access to the game state data.
 */
export class GameStateRepository {

	/**
	 * @param db - The database querier instance used for executing SQL statements.
	 */
	constructor(
		public db: DatabaseQuerier
	) {}

	static fromDB(db: DatabaseQuerier) {
		return new GameStateRepository(db);
	}

	static asMock() {
		const db = createMockDB();
		return GameStateRepository.fromDB(db);
	}

	/**
	 * Throws a GameStateInitializationError if the given game state is not defined.
	 * @param {GameState} gameState - The game state to check.
	 * @throws {GameStateInitializationError} - If the game state is not defined.
	 */
	throwIfNotDefined(gameState: GameState): asserts gameState is DefinedGameState {
		if (!isGameStateDefined(gameState))
			throw new GameStateInitializationError();
	}

	/**
	 * Retrieves the current game state.
	 * @returns The current game state.
	 */
	getDefinedGameState(): DefinedGameState {
		const gameState = asGameState(
			this.db.getRow(
				'SELECT * FROM gameState WHERE id = 1'
			)
		);

		this.throwIfNotDefined(gameState);
		return gameState;
	}

	/**
	 * Sets the current game state.
	 * @param newGameState - The new game state.
	 * @param newGameState.timeStarted - The time when the game started.
	 * @param newGameState.timeEnding - The time when the game is expected to end.
	 * @param newGameState.timeVoteIsEnding - The time when voting is expected to end.
	 * @throws If there are no fields provided to update.
	 */
	setGameState({ timeStarted, timeEnding, timeVoteIsEnding }: WithAtLeastOneProperty<DefinedGameState>) {
		const assignmentExpressions: string[] = [];
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
	 * @returns The time when the game started.
	 */
	getTimeStarted(): Date {
		const dbTimeStarted = this.db.getValue(
			'SELECT timeStarted FROM gameState WHERE id = 1'
		);
		return DBDate.toDomain(dbTimeStarted);
	}

	/**
	 * Sets the time when the game started.
	 * @param timeStarted The time when the game started.
	 */
	setTimeStarted(timeStarted: Date) {
		this.db.run(
			'UPDATE gameState SET timeStarted = ? WHERE id = 1',
			DBDate.fromDomain(timeStarted)
		)
	}

	/**
	 * Retrieves the time when the game is expected to end.
	 * @returns The time when the game is expected to end.
	 */
	getTimeEnding(): Date {
		const dbTimeEnding = this.db.getValue(
			'SELECT timeEnding FROM gameState WHERE id = 1'
		);
		return DBDate.toDomain(dbTimeEnding);
	}

	/**
	 * Sets the time when the game is expected to end.
	 * @param timeEnding - The time when the game is expected to end.
	 */
	setTimeVoting(timeEnding: Date) {
		this.db.run(
			'UPDATE gameState SET timeEnding = ? WHERE id = 1',
			DBDate.fromDomain(timeEnding)
		)
	}

	/**
	 * Retrieves the time when the voting phase is expected to end.
	 * @returns The time when the voting phase is expected to end.
	 */
	getTimeVoteIsEnding(): Date {
		const dbTimeVoteIsEnding = this.db.getValue(
			'SELECT timeVoteIsEnding FROM gameState WHERE id = 1'
		);
		return DBDate.toDomain(dbTimeVoteIsEnding);
	}

	/**
	 * Sets the time when the voting phase is expected to end.
	 * @param timeVoteIsEnding - The time when the voting phase is expected to end.
	 */
	setTimeVotingEnds(timeVoteIsEnding: Date) {
		this.db.run(
			'UPDATE gameState SET timeVoteIsEnding = ? WHERE id = 1',
			DBDate.fromDomain(timeVoteIsEnding)
		)
	}

	reset(): void {
		const doesExist = this.db.doesExistInTable('gameState', { id: 1 });

		if (doesExist)
			this.db.updateInTable('gameState', { 
				fieldsUpdating: { 
					timeStarted: null,
					timeEnding: null,
					timeVoteIsEnding: null
				}, 
				identifiers: { id: 1 } 
			});
		else
			this.db.insertIntoTable('gameState', { id: 1 });
	}
}