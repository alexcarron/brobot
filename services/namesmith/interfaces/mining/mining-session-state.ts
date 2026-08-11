
export type MiningSessionState = {
	currentLayer: number;
	tokensMinedThisSession: number;
	charactersFoundThisSession: string;
	collapseChanceNextLayer: number;
};
