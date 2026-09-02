import fs from "fs";
import { getCachedUser } from "../../../utilities/discord/guild-member-utils";
import { logDebug } from "../../../utilities/logging-utils";
import { TELEMETRY_PLAYER_NAMES_DIRECTORY, TELEMETRY_PLAYER_NAMES_FILE_PATH } from "./telemetry.constants";

/**
 * Maps a player's Discord ID to their last known display name, kept up to date as telemetry is recorded.
 */
export type PlayerNameByID = Record<string, string>;

let cachedRegistry: PlayerNameByID | null = null;
let pendingWrites: Promise<void> = Promise.resolve();

/**
 * Gets the player name registry, reading it from disk once and reusing it after that.
 * @returns The player name registry.
 */
export function getPlayerNameRegistry(): PlayerNameByID {
	if (cachedRegistry === null)
		cachedRegistry = readRegistryFromDisk();

	return cachedRegistry;
}

/**
 * Records a player's current cached Discord username under their ID, if the bot already has that user cached.
 * Never makes a blocking Discord API call, and does nothing if the username is already up to date.
 * @param playerID - The player to record a name for.
 */
export function recordPlayerNameIfKnown(playerID: string): void {
	try {
		const cachedUser = getCachedUser(playerID);
		if (cachedUser === undefined) return;

		const registry = getPlayerNameRegistry();
		if (registry[playerID] === cachedUser.username) return;

		registry[playerID] = cachedUser.username;
		queueRegistryWrite(registry);
	}
	catch (error) {
		logDebug(`A player name could not be recorded for the telemetry registry. ${error instanceof Error ? error.message : String(error)}`);
	}
}

/**
 * Reads the registry file from disk, returning an empty registry if it does not exist yet or fails to parse.
 * @returns The registry read from disk.
 */
function readRegistryFromDisk(): PlayerNameByID {
	try {
		const contents = fs.readFileSync(TELEMETRY_PLAYER_NAMES_FILE_PATH, "utf8");
		return JSON.parse(contents) as PlayerNameByID;
	}
	catch {
		return {};
	}
}

/**
 * Writes the registry to disk, queued behind any write already in flight so two writes never race.
 * @param registry - The registry to write.
 */
function queueRegistryWrite(registry: PlayerNameByID): void {
	pendingWrites = pendingWrites
		.then(() => fs.promises.mkdir(TELEMETRY_PLAYER_NAMES_DIRECTORY, { recursive: true }))
		.then(() => fs.promises.writeFile(TELEMETRY_PLAYER_NAMES_FILE_PATH, JSON.stringify(registry, null, "\t")))
		.catch(error => logDebug(`Failed to write the telemetry player name registry. ${error instanceof Error ? error.message : String(error)}`));
}
