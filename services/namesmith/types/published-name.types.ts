import { ExtractType, number, object, string } from "../../../utilities/runtime-types-utils";
import { PlayerID, PlayerResolvable } from "./player.types";

export const DBPublishedNameType = object.asType({
	id: number,
	playerID: string,
	name: string,
	slotNumber: number,
});
export const asPublishedName = DBPublishedNameType.from;
export const asPublishedNames = DBPublishedNameType.fromAll;
export type PublishedName = ExtractType<typeof DBPublishedNameType>;

export type PublishedNameDefinition = {
	player: PlayerID | PlayerResolvable;
	name: string;
	slotNumber?: number;
};

export type PublishedNameID = PublishedName["id"];
export type PublishedNameResolvable =
	| PublishedNameID
	| { id: PublishedNameID }
	| PublishedName;
