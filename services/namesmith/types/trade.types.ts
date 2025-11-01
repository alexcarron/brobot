import { WithOptional } from "../../../utilities/types/generic-types";
import { PlayerID } from "./player.types";

export type TradeStatus =
	| 'awaitingRecipient'
	| 'awaitingInitiator'
	| 'accepted'
	| 'declined'
	| 'ignored'

export const TradeStatuses = Object.freeze({
	AWAITING_RECIPIENT: 'awaitingRecipient',
	AWAITING_INITIATOR: 'awaitingInitiator',
	ACCEPTED: 'accepted',
	DECLINED: 'declined',
	IGNORED: 'ignored',
} as const);

export type Trade = {
	id: number;
	initiatingPlayerID: PlayerID;
	recipientPlayerID: PlayerID;
	offeredCharacters: string;
	requestedCharacters: string;
	status: TradeStatus;
}

export type DBTrade = Trade;

export type TradeDefintion = WithOptional<Trade, "id">;

export type TradeID = Trade['id'];
export type TradeResolveable =
	| { id: TradeID }
	| TradeID;
