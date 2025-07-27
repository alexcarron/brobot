export interface GameState {
	timeStarted: Date;
	timeEnding: Date;
	timeVoteIsEnding: Date;
}

export interface DBGameState {
	timeStarted: string | null;
	timeEnding: string | null;
	timeVoteIsEnding: string | null;
}