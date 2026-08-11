import path from "path";

/**
 * The directory that holds every telemetry game file.
 */
export const TELEMETRY_GAMES_DIRECTORY = path.join(__dirname, "games");

/**
 * The file name used when an event is recorded while no game is defined.
 */
export const UNASSIGNED_GAME_FILE_NAME = "game-unassigned.jsonl";
