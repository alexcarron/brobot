import { toEnumFromStrings, ValuesOf } from '../../../utilities/enum-utilts';
import { Override } from "../../../utilities/types/generic-types";
import { Player, PlayerID, PlayerResolvable } from "./player.types";


/**
 * Status values object (runtime) and derived type (compile-time).
 * Single source of truth.
 */
export const TradeStatuses = toEnumFromStrings(
	'awaitingRecipient',
	'awaitingInitiator',
	'accepted',
	'declined',
	'ignored'
);

export type TradeStatus = ValuesOf<typeof TradeStatuses>;

export type Trade = {
	id: number;
	initiatingPlayer: Player;
	recipientPlayer: Player;
	offeredCharacters: string;
	requestedCharacters: string;
	status: TradeStatus;
}

export type DBTrade = {
	id: TradeID,
	initiatingPlayerID: PlayerID,
	recipientPlayerID: PlayerID,
	offeredCharacters: string;
	requestedCharacters: string;
	status: TradeStatus;
};

export type TradeDefintion = Override<Trade, {
	id?: TradeID,
	initiatingPlayer: PlayerResolvable,
	recipientPlayer: PlayerResolvable
}>;

export type TradeID = Trade['id'];
export type TradeResolveable =
	| { id: TradeID }
	| TradeID;
