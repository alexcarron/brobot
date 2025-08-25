import { getCharacterDifferencesInStrings } from '../../../utilities/data-structure-utils';
import { CustomError } from '../../../utilities/error-utils';
import { escapeDiscordMarkdown } from '../../../utilities/string-manipulation-utils';
import { Player } from '../types/player.types';
import { Recipe } from '../types/recipe.types';

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

/**
 * Error thrown when a requested namesmith character is not found.
 */
export class CharacterNotFoundError extends ResourceNotFoundError {
	constructor(characterID: number) {
		super({
			message: `Character with ID ${characterID} not found.`,
			relevantData: { characterID }
		})
	}
}

/**
 * Error thrown when a requested namesmith recipe is not found.
 */
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

/**
 * Error thrown when a user action is blocked, prevented, or used incorrectly and must be handled by the interface.
 */
export class UserActionError extends NamesmithError {
	override userFriendlyMessage: string;
	override relevantData: Record<string, unknown>;

	constructor({
		message,
		userFriendlyMessage,
		relevantData,
		errorCausedBy = undefined,
	}: {
		message: string,
		userFriendlyMessage: string,
		relevantData: Record<string, unknown>,
		errorCausedBy?: Error,

	}) {
		super({
			message,
			userFriendlyMessage,
			errorCausedBy,
			relevantData
		});

		this.userFriendlyMessage = userFriendlyMessage;
		this.relevantData = relevantData;
	}
}

/**
 * Error thrown when a player is missing required characters for a recipe
 */
export class MissingRequiredCharactersError extends UserActionError {
	constructor(player: Player, recipe: Recipe) {
		const { missingCharacters } =
			getCharacterDifferencesInStrings(recipe.inputCharacters, player.inventory);

		const missingCharactersDisplay =
			escapeDiscordMarkdown(missingCharacters.join(''))

		super({
			message: `Player is missing required characters for recipe`,
			userFriendlyMessage:
				`You are missing ${missingCharacters.length} required characters for this recipe: ${missingCharactersDisplay}`,
			relevantData: {
				player,
				recipe,
			}
		})
	}
}

/**
 * Error thrown when a recipe is not unlocked for a player
 */
export class RecipeNotUnlockedError extends UserActionError {
	constructor(player: Player, recipe: Recipe) {
		super({
			message: `Recipe is not unlocked for player`,
			userFriendlyMessage:
				`You must unlock this recipe before you can use it.`,
			relevantData: {
				player,
				recipe,
			}
		})
	}
}

/**
 * Error thrown when a non-player user uses an action that requires them to be a player
 */
export class NotAPlayerError extends UserActionError {
	constructor(userID: string, userActionAttempting?: string) {
		const message =
			userActionAttempting
				? `Non-player user, ${userID}, attempted to ${userActionAttempting} which requires them to be a player`
				: `Non-player user, ${userID}, attempted to use an action which requires them to be a player`;

		const userFriendlyMessage =
			userActionAttempting
				? `You must be a player to ${userActionAttempting}.`
				: `You must be a player to use this.`

		super({
			message,
			userFriendlyMessage,
			relevantData: {
				userID,
				userActionAttempting,
			}
		})
	}
}

/**
 * Error thrown when a non-player user attempts to craft a character
 */
export class NonPlayerCraftedError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "craft a character");
	}
}

/**
 * Error thrown when a provided string for a name is not valid
 */
export class InvalidNameError extends NamesmithError {}

/**
 * Error thrown when a provided name is too long
 */
export class NameTooLongError extends InvalidNameError {
	constructor(name: string, maxLength: number) {
		super({
			message: `Provided name, "${name}", exceeds the maximum length of ${maxLength} characters.`,
			userFriendlyMessage: `Your name cannot be longer than ${maxLength} characters.`,
			relevantData: {
				name,
				maxLength,
			}
		})
	}
}