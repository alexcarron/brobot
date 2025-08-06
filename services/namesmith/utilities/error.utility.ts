import { CustomError } from '../../../utilities/error-utils';

/**
 * Base class for all errors thrown by the namesmith service
 */
export class NamesmithError extends CustomError {}

/**
 * Error thrown when an SQL query is used incorrectly
 */
export class QueryUsageError extends NamesmithError {
	constructor(message: string, sqlQuery: string, params?: object | unknown[]) {
		super({
			message,
			relevantData: {
				sqlQuery,
				params
			}
		})
	}}

/**
 * Error thrown when an SQL query unexpectedly contains more than one statement
 */
export class MultiStatementQueryError extends QueryUsageError {
	constructor(sqlQuery: string, params?: object | unknown[]) {
		super(
			 `SQL query contains more than one statement and parameters are not supported with multi-statement queries: ${sqlQuery}`,
			sqlQuery,
			params
		)
	}
}

/**
 * Error thrown when an executed SQL query doesn't meet a foreign key constraint
 */
export class ForeignKeyConstraintError extends QueryUsageError {
	constructor(sqlQuery: string, params?: object | unknown[]) {
		let message = `SQL query failed a foreign key constraint: ${sqlQuery}`

		if (params !== undefined)
			message += ` with parameters: ${JSON.stringify(params)}`

		super(message, sqlQuery, params)
	}
}

/**
 * Base class for errors related to namesmith resource operations.
 */
export class ResourceError extends NamesmithError {}

/**
 * Error thrown when a requested namesmith resource is not found.
 */
export class ResourceNotFoundError extends ResourceError {}

/**
 * Error thrown when a namesmith player is not found.
 */
export class PlayerNotFoundError extends ResourceNotFoundError {
	constructor(playerID: string) {
		super({
			message: `Player with ID ${playerID} not found.`,
			relevantData: { playerID }
		})
	}
}

/**
 * Error thrown when a namesmith vote is not found.
 */
export class VoteNotFoundError extends ResourceNotFoundError {
	constructor(voteID: string) {
		super({
			message: `Vote with ID ${voteID} not found.`,
			relevantData: { voteID }
		})
	}
}

/**
 * Error thrown when a requested namesmith mystery box is not found.
 */
export class MysteryBoxNotFoundError extends ResourceNotFoundError {
	constructor(mysteryBoxID: string) {
		super({
			message: `Mystery box with ID ${mysteryBoxID} not found.`,
			relevantData: { mysteryBoxID }
		})
	}
}

export class CharacterNotFoundError extends ResourceNotFoundError {
	constructor(characterID: number) {
		super({
			message: `Character with ID ${characterID} not found.`,
			relevantData: { characterID }
		})
	}
}

export class RecipeNotFoundError extends ResourceNotFoundError {
	constructor(recipeID: number) {
		super({
			message: `Recipe with ID ${recipeID} not found.`,
			relevantData: { recipeID }
		})
	}
}

/**
 * Error thrown when a requested namesmith resource already exists.
 */
export class ResourceAlreadyExistsError extends ResourceError {}

/**
 * Error thrown when a requested namesmith player already exists.
 */
export class PlayerAlreadyExistsError extends ResourceAlreadyExistsError {
	constructor(playerID: string) {
		super({
			message: `Cannot add player. Player with ID ${playerID} already exists.`,
			relevantData: { playerID }
		})
	}
}

/**
 * Error thrown when a requested namesmith vote already exists.
 */
export class VoteAlreadyExistsError extends ResourceAlreadyExistsError {
	constructor(voteID: string) {
		super({
			message: `Cannot add vote. Vote with ID ${voteID} already exists.`,
			relevantData: { voteID }
		})
	}
}

/**
 * Error thrown when the state of an entity is not initialized before it is used.
 */
export class StateInitializationError extends NamesmithError {}

/**
 * Error thrown when the state of the game is not initialized before it is used.
 */
export class GameStateInitializationError extends StateInitializationError {
	constructor() {
		super({
			message: "The Namesmith game state has not initialized before it was used.",
			relevantData: {}
		})
	}
}