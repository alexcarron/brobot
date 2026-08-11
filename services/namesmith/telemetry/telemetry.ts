import fs from "fs";
import path from "path";
import { logDebug } from "../../../utilities/logging-utils";
import { getGameContext, getGameFileNameFromGameID } from "./telemetry-game-context";
import { TELEMETRY_GAMES_DIRECTORY } from "./telemetry.constants";
import { EventType, TelemetryRecord, TelemetryTrackingDetails } from "./telemetry-event.types";
import { Quest } from "../types/quest.types";

const isRunningUnderJest = process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === "test";

let pendingAppends: Promise<void> = Promise.resolve();
let hasEnsuredGamesDirectory = false;

/**
 * Records player behavior events to per-game files.
 */
export const telemetry = {
	track,
	trackQuestsShown,
};

/**
 * Records one event and returns right away.
 * @param trackingDetails - The event type, the player it is about, and the event's fields.
 */
function track(trackingDetails: TelemetryTrackingDetails): void {
	try {
		if (isRunningUnderJest) return;

		const currentTime = Date.now();
		const record: TelemetryRecord = {
			...trackingDetails,
			...getGameContext(currentTime),
			currentTime,
		};

		appendLine(getGameFileNameFromGameID(record.gameID), JSON.stringify(record));
	}
	catch (error) {
		swallowRecordingError(error);
	}
}

/**
 * Records a shown event for each quest.
 * @param quests - The quests that were just shown.
 * @param options - Details about the shown quests.
 * @param options.areHiddenQuests - True if these are hidden quests.
 */
function trackQuestsShown(quests: Quest[], { areHiddenQuests }: { areHiddenQuests: boolean }): void {
	for (const quest of quests) {
		telemetry.track({
			eventType: EventType.QUEST_SHOWN,
			questID: quest.id,
			isHiddenQuest: areHiddenQuests,
		});
	}
}

/**
 * Adds one line to a game's file, waiting behind the previous write so two events never mix into one line.
 * @param fileName - The game's file name.
 * @param line - The JSON line to add, without the newline.
 */
function appendLine(fileName: string, line: string): void {
	const filePath = path.join(TELEMETRY_GAMES_DIRECTORY, fileName);

	pendingAppends = pendingAppends
		.then(ensureGamesDirectoryExists)
		.then(() => fs.promises.appendFile(filePath, line + "\n"))
		.catch(swallowRecordingError);
}

/**
 * Makes the games folder the first time it is written to.
 */
async function ensureGamesDirectoryExists(): Promise<void> {
	if (hasEnsuredGamesDirectory) return;
	await fs.promises.mkdir(TELEMETRY_GAMES_DIRECTORY, { recursive: true });
	hasEnsuredGamesDirectory = true;
}

/**
 * Swallows a failed write, logging it quietly so it never reaches the game.
 * @param error - The error to swallow.
 */
function swallowRecordingError(error: unknown): void {
	const reason = error instanceof Error ? error.message : String(error);
	logDebug(`A telemetry event could not be recorded. ${reason}`);
}
