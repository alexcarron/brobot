import { getCharacterDifferences } from '../../../utilities/data-structure-utils';
import { CustomError } from '../../../utilities/error-utils';
import { escapeDiscordMarkdown } from '../../../utilities/string-manipulation-utils';
import { isNumber } from '../../../utilities/types/type-guards';
import { CharacterID } from '../types/character.types';
import { MinimalMysteryBox, MysteryBoxID } from '../types/mystery-box.types';
import { PerkID, PerkName } from '../types/perk.types';
import { Player } from '../types/player.types';
import { Recipe, RecipeID } from '../types/recipe.types';
import { RoleID } from '../types/role.types';
import { Trade, TradeID, TradeResolveable } from '../types/trade.types';
import { VoteID } from '../types/vote.types';

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
 * Error thrown when a
 */
export class CannotCreateTradeError extends ResourceError {
	declare relevantData: {
		initiatingPlayerID: string,
		recipientPlayerID: string,
		offeredCharacters: string,
		requestedCharacters: string
	}

	constructor(
		{initiatingPlayerID, recipientPlayerID, offeredCharacters, requestedCharacters}: {
			initiatingPlayerID: string,
			recipientPlayerID: string,
			offeredCharacters: string,
			requestedCharacters: string
		}
	) {
		super({
			message: `Cannot create trade between ${initiatingPlayerID} and ${recipientPlayerID} with offered characters ${offeredCharacters} and requested characters ${requestedCharacters}.`,
			relevantData: {
				initiatingPlayerID,
				recipientPlayerID,
				offeredCharacters,
				requestedCharacters
			}
		})
	}
}

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
	constructor(voteID: VoteID) {
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
	constructor(mysteryBoxID: MysteryBoxID) {
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
	constructor(characterID: CharacterID) {
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
	constructor(recipeID: RecipeID) {
		super({
			message: `Recipe with ID ${recipeID} not found.`,
			relevantData: { recipeID }
		})
	}
}

/**
 * Error thrown when a requested namesmith trade is not found.
 */
export class TradeNotFoundError extends ResourceNotFoundError {
	declare relevantData: { tradeID: TradeID }

	constructor(tradeID: TradeID) {
		super({
			message: `Trade with ID ${tradeID} not found.`,
			relevantData: { tradeID }
		})
	}
}

/**
 * Error thrown when a requested namesmith perk is not found.
 */
export class PerkNotFoundError extends ResourceNotFoundError {
	declare relevantData: {
		perkID?: PerkID
		perkName?: PerkName
	}
	constructor(perkIDOrName: PerkID | PerkName) {
		const isID = isNumber(perkIDOrName);

		if (isID) {
			super({
				message: `Perk with ID ${perkIDOrName} not found.`,
				relevantData: { perkID: perkIDOrName }
			})
		}
		else {
			super({
				message: `Perk with name "${perkIDOrName}" not found.`,
				relevantData: { perkName: perkIDOrName }
			})
		}
	}
}

/**
 * Error thrown when a requested namesmith role is not found.
 */
export class RoleNotFoundError extends ResourceNotFoundError {
	declare relevantData: { roleID: RoleID }
	constructor(roleID: RoleID) {
		super({
			message: `Role with ID ${roleID} not found.`,
			relevantData: { roleID }
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
 * Error thrown when an entity is in an invalid state for the attempted operation.
 */
export class InvalidStateError extends NamesmithError {}

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
	declare relevantData: { player: Player, recipe: Recipe };
	constructor(player: Player, recipe: Recipe) {
		const { missingCharacters } =
			getCharacterDifferences(recipe.inputCharacters, player.inventory);

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
 * Error thrown when a player is missing offered characters for a trade
 */
export class MissingOfferedCharactersError extends UserActionError {
	declare relevantData: { player: Player, offeredCharacters: string };

	constructor(player: Player, offeredCharacters: string) {
		super({
			message: `Player is missing offered characters for trade`,
			userFriendlyMessage:
				`You are missing ${offeredCharacters.length} offered characters for this trade.`,
			relevantData: {
				player,
				offeredCharacters,
			}
		})
	}
}

/**
 * Error thrown when a recipient player is missing requested characters for a trade
 */
export class MissingRequestedCharactersError extends UserActionError {
	declare relevantData: { player: Player, requestedCharacters: string };

	constructor(player: Player, requestedCharacters: string) {
		super({
			message: `Player is missing requested characters for trade`,
			userFriendlyMessage:
				`You are missing ${requestedCharacters.length} requested characters for this trade.`,
			relevantData: {
				player,
				requestedCharacters,
			}
		})
	}
}

/**
 * Error thrown when a player attempts to trade with themselves
 */
export class TradeBetweenSamePlayersError extends UserActionError {
	declare relevantData: { player: Player };
	constructor(player: Player) {
		super({
			message: `A player attempted to trade with themselves.`,
			userFriendlyMessage:
				`You cannot trade with yourself!`,
			relevantData: {
				player,
			}
		})
	}
}

/**
 * Error thrown a player responds to a trade that has already been responded to
 */
export class TradeAlreadyRespondedToError extends UserActionError {
	declare relevantData: { player: Player, trade: Trade };
	constructor(player: Player, trade: Trade) {
		super({
			message: `A player attempted to respond to a trade that has already been responded to.`,
			userFriendlyMessage:
				`This trade has already been responded to!`,
			relevantData: {
				player,
				trade,
			}
		})
	}
}

/**
 * Error thrown a player responds to a trade that is awaiting a different player's response
 */
export class TradeAwaitingDifferentPlayerError extends UserActionError {
	declare relevantData: {
		playerAwaitingTrade: Player,
		trade: Trade
	};
	constructor(playerAwaitingTrade: Player, trade: Trade) {
		super({
			message: `A player attempted to respond to a trade that is awaiting a different player's response.`,
			userFriendlyMessage:
				`You can only respond to a trade that is awaiting your response!`,
			relevantData: {
				playerAwaitingTrade,
				trade,
			}
		})
	}
}

/**
 * Error thrown when a player attempts to respond to a trade they cannot respond to
 */
export class CannotRespondToTradeError extends UserActionError {
	declare relevantData: { player: Player, trade: Trade };

	constructor(player: Player, trade: Trade) {
		super({
			message: `A player attempted to respond to a trade request they cannot respond to.`,
			userFriendlyMessage:
				`You cannot respond to this trade request.`,
			relevantData: {
				player,
				trade,
			}
		})
	}
}

/**
 * Error thrown when a recipe is not unlocked for a player
 */
export class RecipeNotUnlockedError extends UserActionError {
	declare relevantData: { player: Player, recipe: Recipe };
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
 * Error thrown when a player attempts to claim a refill before the next available refill time
 */
export class RefillAlreadyClaimedError extends UserActionError {
	declare relevantData: { player: Player, nextRefillTime: Date };

	constructor(player: Player, nextRefillTime: Date) {
		super({
			message: `Player ${player.currentName} attempted to claim a refill before the next refill time of ${nextRefillTime}.`,
			userFriendlyMessage:
				`You already claimed your refill! The next available refill is at ${nextRefillTime}.`,
			relevantData: {
				player,
				nextRefillTime,
			}
		})
	}
}

/**
 * Error thrown when a player attempts to buy a mystery box that is too expensive
 */
export class PlayerCantAffordMysteryBoxError extends UserActionError {
	declare relevantData: { mysteryBox: MinimalMysteryBox, player: Player };
	constructor(mysteryBox: MinimalMysteryBox, player: Player) {
		super({
			message: `Player ${player.currentName} attempted to buy the mystery box ${mysteryBox.name} but they cannot afford it.`,
			userFriendlyMessage:
				`You cannot afford the "${mysteryBox.name}" mystery box.`,
			relevantData: {
				mysteryBox,
				player,
			}
		})
	}
}

/**
 * Error thrown when a player attempts to respond to a trade that does not exist
 */
export class NonTradeRespondedToError extends UserActionError {
	declare relevantData: { player: Player, trade: TradeResolveable };

	constructor(player: Player, trade: TradeResolveable) {
		super({
			message: `A player attempted to respond to a trade that does not exist.`,
			userFriendlyMessage: `You cannot respond to this trade because it does not exist.`,
			relevantData: {
				player,
				trade,
			}
		})
	}
}

/**
 * Error thrown when a trade that is ignored cannot be ignored
 */
export class CannotIgnoreTradeError extends UserActionError {
	declare relevantData: { trade: Trade };

	constructor(trade: Trade) {
		super({
			message: `A player attempted to ignore a trade that cannot be ignored.`,
			userFriendlyMessage: `You cannot ignore this trade.`,
			relevantData: {
				trade,
			}
		})
	}
}

/**
 * Error thrown when a non-player user uses an action that requires them to be a player
 */
export class NotAPlayerError extends UserActionError {
	declare relevantData: { userID: string, userActionAttempting?: string };
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
 * Error thrown when a non-player user attempts to mine tokens
 */
export class NonPlayerMinedError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "mine tokens");
	}
}

/**
 * Error thrown when a non-player user attempts to refill tokens
 */
export class NonPlayerRefilledError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "refill tokens");
	}
}

/**
 * Error thrown when a non-player user attempts to buy a mystery box
 */
export class NonPlayerBoughtMysteryBoxError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "buy a mystery box");
	}
}

/**
 * Error thrown when a non-player user attempts to initiate a trade
 */
export class NonPlayerInitiatedTradeError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "initiate a trade");
	}
}

/**
 * Error thrown when a non-player user receives a trade request
 */
export class NonPlayerReceivedTradeError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "receive a trade request");
	}
}

/**
 * Error thrown when a non-player user attempts to respond a trade request
 */
export class NonPlayerRespondedToTradeError extends NotAPlayerError {
	constructor(userID: string) {
		super(userID, "respond to a trade request");
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
	declare relevantData: { name: string, maxLength: number };
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