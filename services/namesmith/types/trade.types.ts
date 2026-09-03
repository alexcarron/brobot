import { toEnumFromStrings, ValuesOf } from '../../../utilities/enum-utilts';
import { ExtractType, number, object, string, strings } from '../../../utilities/runtime-types-utils';
import { Override } from "../../../utilities/types/generic-types";
import { Player, PlayerResolvable } from "./player.types";

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

export const DBTradeType = object.asType({
	id: number,
	initiatingPlayerID: string,
	recipientPlayerID: string,
	offeredCharacters: string,
	requestedCharacters: string,
	status: strings(...Object.values(TradeStatuses)),
});
export const asMinimalTrade = DBTradeType.from;
export const asMinimalTrades = DBTradeType.fromAll;
export type MinimalTrade = ExtractType<typeof DBTradeType>;

export type TradeDefintion = Override<Trade, {
	id?: TradeID,
	initiatingPlayer: PlayerResolvable,
	recipientPlayer: PlayerResolvable
}>;

export type TradeID = Trade['id'];
export type TradeResolvable =
	| { id: TradeID }
	| TradeID;
