import { ExtractDomainType, number, object, string } from "../../../utilities/runtime-types-utils";
import { Override } from "../../../utilities/types/generic-types";
import { DBBoolean, DBDate } from "../utilities/db.utility";
import { Perk, PerkResolvable } from "./perk.types";
import { Role, RoleResolvable } from "./role.types";

export const DBPlayerType = object.asTransformableType('MinimalPlayer', {
	id: string,
	currentName: string,
	publishedName: string.orNull,
	tokens: number,
	role: number.orNull,
	inventory: string,
	lastClaimedRefillTime: DBDate.orNull,
	hasPickedPerk: DBBoolean,
});
export const asMinimalPlayer = DBPlayerType.toMinimalPlayer;
export const asMinimalPlayers = DBPlayerType.toMinimalPlayers;
export type MinimalPlayer = ExtractDomainType<typeof DBPlayerType>

export type Player = {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	inventory: string;
	lastClaimedRefillTime: Date | null;
	role: Role | null;
	perks: Perk[];
	hasPickedPerk: boolean;
}

export type PlayerDefinition = Override<Player, {
	id?: string,
	role: RoleResolvable | null,
	perks: PerkResolvable[],
	hasPickedPerk?: boolean,
}>;

export type PlayerID = Player["id"];
export type PlayerName = Player["currentName"];
export type Inventory = Player["inventory"];
export type PlayerResolvable =
	| {id: PlayerID}
	| PlayerID;