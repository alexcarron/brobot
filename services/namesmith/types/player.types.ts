import { Override } from "../../../utilities/types/generic-types";

export type Player = {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	role: string | null;
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

export type PlayerID = Player["id"];

export type Inventory = Player["inventory"];

export type PlayerResolvable = Player | PlayerID;
