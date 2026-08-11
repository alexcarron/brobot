
export type MiningSessionState = {
	sessionID: string;
	currentLayer: number;
	tokensMinedThisSession: number;
	charactersFoundThisSession: string;
	collapseChanceNextLayer: number;
};
