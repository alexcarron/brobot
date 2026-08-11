import { joinLines } from "../../../../utilities/string-manipulation-utils";
import { toCharacterDiscoveredLines, toSessionStatusLines, toTokensGainedLines } from "./mining-message-lines";
import { MiningSessionState } from "./mining-session-state";

/**
 * Builds the message text shown after mining a layer deeper without a collapse.
 * @param params - The parameters for the function.
 * @param params.state - The mining session state, after this mine has been applied to it.
 * @param params.tokensGained - The tokens gained from this mine.
 * @param params.characterDiscovered - The character discovered from this mine, if any.
 * @param params.hasMineBonusPerk - Whether the player has the mine bonus perk.
 * @returns The mine deeper message text.
 */
export function toMineDeeperMessageText(
	{ state, tokensGained, characterDiscovered, hasMineBonusPerk }: {
		state: MiningSessionState;
		tokensGained: number;
		characterDiscovered: string | null;
		hasMineBonusPerk: boolean;
	}
): string {
	return joinLines(
		toTokensGainedLines({ tokensGained, hasMineBonusPerk }),
		toCharacterDiscoveredLines(characterDiscovered),
		toSessionStatusLines(state),
	);
}
