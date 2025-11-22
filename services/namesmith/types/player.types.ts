import { Override, Without } from "../../../utilities/types/generic-types";
import { Perk, PerkResolvable } from "./perk.types";
import { Role, RoleResolvable } from "./role.types";

export type Player = {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	inventory: string;
	lastClaimedRefillTime: Date | null;
	role: Role | null;
	perks: Perk[];
}

export type MinimalPlayer = Without<Player, "role" | "perks">;

export type DBPlayer = Override<Player, {
	lastClaimedRefillTime: string | null,
	perks: undefined,
}>;

export type PlayerDefinition = Override<Player, {
	id?: string,
	role: RoleResolvable | null,
	perks: PerkResolvable[];
}>;

export type PlayerID = Player["id"];
export type PlayerName = Player["currentName"];
export type Inventory = Player["inventory"];
export type PlayerResolvable =
	| {id: PlayerID}
	| PlayerID;