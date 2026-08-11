import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { getTokensEarnedFeedback, toDisplayedCharactersInline } from "../../utilities/player-message.utility";
import { MiningSessionState } from "./mining-session-state";

/**
 * Builds the message shown when a player resurfaces from a mining session.
 * @param state - The mining session state being cashed out.
 * @returns The resurface message text.
 */
export function toResurfaceMessageText(state: MiningSessionState): string {
	return joinLines(
		`You resurface with all your mined tokens safe.`,
		getTokensEarnedFeedback(state.tokensMinedThisSession, { isOneLine: true }),
		toCharactersFoundLine(state.charactersFoundThisSession),
	);
}

function toCharactersFoundLine(charactersFoundThisSession: string): string | null {
	if (charactersFoundThisSession.length === 0) return null;
	return `Characters mined this session: ${toDisplayedCharactersInline(charactersFoundThisSession)}`;
}
