import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { toSessionStatusLines } from "./mining-message-lines";
import { MiningSessionState } from "./mining-session-state";

/**
 * Builds the message text shown after auto-mining stops and control returns to the player.
 * @param state - The mining session state at the point auto-mining stopped.
 * @returns The auto-mine stopped message text.
 */
export function toAutoMineStoppedMessageText(state: MiningSessionState): string {
	return joinLines(
		`You stopped auto-mining.`,
		...toSessionStatusLines(state),
	);
}
