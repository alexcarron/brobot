import path from "path";

/**
 * The directory that holds every telemetry game file.
 */
export const TELEMETRY_GAMES_DIRECTORY = path.join(__dirname, "games");

/**
 * The file name used when an event is recorded while no game is defined.
 */
export const UNASSIGNED_GAME_FILE_NAME = "game-unassigned.jsonl";

/**
 * The directory that holds the player ID to display name registry used by the analysis scripts.
 */
export const TELEMETRY_PLAYER_NAMES_DIRECTORY = path.join(__dirname, "player-names");

/**
 * The file that maps a player's Discord ID to their last known display name.
 */
export const TELEMETRY_PLAYER_NAMES_FILE_PATH = path.join(TELEMETRY_PLAYER_NAMES_DIRECTORY, "player-names.json");
