import { PlayerID } from "./player.types";

export type TradeStatus =
	| 'awaitingRecipient'
	| 'awaitingInitiater'
	| 'accepted'
	| 'declined'

export const TradeStatuses = Object.freeze({
	AWAITING_RECIPIENT: 'awaitingRecipient',
	AWAITING_INITIATER: 'awaitingInitiater',
	ACCEPTED: 'accepted',
	DECLINED: 'declined'
} as const);

export type Trade = {
	id: number;
	initiatingPlayer: PlayerID;
	recipientPlayer: PlayerID;
	offeredCharacters: string;
	requestedCharacters: string;
	status: TradeStatus;
}

/**
 * DBTrade represents a trade stored in the database.
 * Currently identical to Trade but kept for semantic clarity.
 */
export type DBTrade = Trade

export type TradeID = Trade['id'];

export type TradeResolveable = Trade | TradeID
