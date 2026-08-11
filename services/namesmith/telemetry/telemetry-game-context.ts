import { getNamesmithServices } from "../services/get-namesmith-services";
import { GamePhase, TelemetryGameContext } from "./telemetry-event.types";
import { UNASSIGNED_GAME_FILE_NAME } from "./telemetry.constants";

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

const EMPTY_GAME_CONTEXT: TelemetryGameContext = {
	gameID: null,
	currentGameDay: null,
	currentPhase: null,
	hoursIntoBuildPhase: null,
	hoursIntoVotePhase: null,
};

/**
 * Gets where in the game an event happened, or empty context if no game has started.
 * @param currentTime - When the event happened, in milliseconds.
 * @returns The game context for that moment.
 */
export function getGameContext(currentTime: number): TelemetryGameContext {
	try {
		const { gameStateService } = getNamesmithServices();

		if (!gameStateService.hasStarted())
			return EMPTY_GAME_CONTEXT;

		const gameStart = gameStateService.getTimeGameStarts();
		const voteStart = gameStateService.getTimeVotingStarts();
		const voteEnd = gameStateService.getTimeVotingEnds();
		const now = new Date(currentTime);

		let currentPhase: GamePhase;
		let hoursIntoBuildPhase: number | null = null;
		let hoursIntoVotePhase: number | null = null;

		if (now < voteStart) {
			currentPhase = "build";
			hoursIntoBuildPhase = (currentTime - gameStart.getTime()) / MILLISECONDS_PER_HOUR;
		}
		else if (now < voteEnd) {
			currentPhase = "vote";
			hoursIntoVotePhase = (currentTime - voteStart.getTime()) / MILLISECONDS_PER_HOUR;
		}
		else {
			currentPhase = "ended";
		}

		return {
			gameID: gameStart.toISOString(),
			currentGameDay: getGameDayForTime(gameStateService.getTimesDayStarts(), voteStart, now),
			currentPhase,
			hoursIntoBuildPhase,
			hoursIntoVotePhase,
		};
	}
	catch {
		return EMPTY_GAME_CONTEXT;
	}
}

/**
 * Gets the game day a moment falls in, counting from 1, or null if it is past the build phase.
 * @param dayStarts - When each game day starts, in order.
 * @param voteStart - When the build phase ends and voting begins.
 * @param now - The moment to place.
 * @returns The game day counting from 1, or null if past the build phase.
 */
function getGameDayForTime(dayStarts: Date[], voteStart: Date, now: Date): number | null {
	for (let dayIndex = 0; dayIndex < dayStarts.length; dayIndex++) {
		const dayStart = dayStarts[dayIndex];
		const nextDayStart = dayStarts[dayIndex + 1] ?? voteStart;

		if (now >= dayStart && now < nextDayStart)
			return dayIndex + 1;
	}

	return null;
}

/**
 * Gets the file name for a game's events from the game's id.
 * @param gameID - The game's start time as an ISO string, or null if no game has started.
 * @returns The file name for that game's events.
 */
export function getGameFileNameFromGameID(gameID: string | null): string {
	if (gameID === null)
		return UNASSIGNED_GAME_FILE_NAME;

	const safeTimestamp = gameID
		.replace(/Z$/, "")
		.replace(/[:.]/g, "-")
		.replace("T", "-T");

	return `game-on-${safeTimestamp}.jsonl`;
}
