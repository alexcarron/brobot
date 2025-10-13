import { Override } from "../../../utilities/types/generic-types";
import { Role } from "./role.types";

export type Player = {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	role: Role | null;
	inventory: string;
	lastClaimedRefillTime: Date | null;
}

/**
 * DBPlayer represents a Player stored in the database.
 * Currently identical to Player but kept for semantic clarity.
 */
export type DBPlayer = Override<Player, {
	lastClaimedRefillTime: string | null
}>;

export type PlayerDefinition = Override<Player, {
	role: null,
}>;

export type PlayerID = Player["id"];
export type PlayerName = Player["currentName"];
export type Inventory = Player["inventory"];

export type PlayerResolvable = Player | PlayerID;
