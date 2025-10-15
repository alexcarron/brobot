import { Override, Without } from "../../../utilities/types/generic-types";
import { Perk, PerkID, PerkName } from "./perk.types";
import { Role } from "./role.types";

export type Player = {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	role: Role | null;
	perks: Perk[];
	inventory: string;
	lastClaimedRefillTime: Date | null;
}

export type MinimalPlayer = Without<Player, "role" | "perks">;

/**
 * DBPlayer represents a Player stored in the database.
 * Currently identical to Player but kept for semantic clarity.
 */
export type DBPlayer = Override<Player, {
	lastClaimedRefillTime: string | null,
	perks: undefined,
}>;

export type PlayerDefinition = Override<Player, {
	role: null,
	perks: Array<PerkID | PerkName>;
}>;

export type PlayerID = Player["id"];
export type PlayerName = Player["currentName"];
export type Inventory = Player["inventory"];

export type PlayerResolvable = Player | PlayerID;
