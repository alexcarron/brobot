export interface Player {
	id: string;
	currentName: string;
	publishedName: string | null;
	tokens: number;
	role: string | null;
	inventory: string;
};

export interface DBPlayer extends Player {};

export type PlayerID = Player["id"];

export type Inventory = Player["inventory"];

export type PlayerResolvable = Player | PlayerID;
