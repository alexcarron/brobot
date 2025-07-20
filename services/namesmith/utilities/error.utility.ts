import { CustomError } from '../../../utilities/error-utils';

/**
 * Base class for all errors thrown by the namesmith service
 */
export class NamesmithError extends CustomError {}

/**
 * Error thrown when an SQL query is used incorrectly
 */
export class QueryUsageError extends NamesmithError {}

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