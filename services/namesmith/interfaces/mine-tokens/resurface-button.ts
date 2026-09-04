import { ButtonInteraction, ButtonStyle } from "discord.js";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { MiningSessionState } from "./mining-session-state";
import { toResurfaceMessageText } from "./resurface-message";
import { doesUserOwnMiningSessionOfButton, sendMiningSessionFollowUpMessage } from "./mining-session-buttons";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { NOT_SESSION_OWNER_FEEDBACK } from "./mining-message-lines";
import { telemetry } from "../../telemetry/telemetry";
import { EventType } from "../../telemetry/telemetry-event.types";

const RESURFACE_LABEL = `Resurface`;

/**
 * Returns the button definition that cashes out a player's mining session and returns them to the surface.
 * @param userID - The ID of the player who started the mining session.
 * @param state - The current mining session state.
 * @returns The button definition.
 */
export function getResurfaceButton(userID: string, state: MiningSessionState): DiscordButtonDefinition {
	return {
		id: `mine-resurface-${userID}`,
		label: RESURFACE_LABEL,
		style: ButtonStyle.Success,
		onButtonPressed: (buttonInteraction) => onResurfaceButtonPressed(buttonInteraction, userID, state),
	};
}

async function onResurfaceButtonPressed(
	buttonInteraction: ButtonInteraction, userID: string, state: MiningSessionState
): Promise<void> {
	if (!doesUserOwnMiningSessionOfButton(userID, buttonInteraction)) {
		await replyToInteraction(buttonInteraction, NOT_SESSION_OWNER_FEEDBACK);
		return 
	}

	telemetry.track({
		eventType: EventType.MINE_SESSION_ENDED,
		playerID: userID,
		miningSessionID: state.sessionID,
		layersDug: state.currentLayer,
		outcome: "resurfaced",
		tokensKept: state.tokensMinedThisSession,
		tokensLostToCollapse: 0,
	});

	await sendMiningSessionFollowUpMessage(buttonInteraction, {
		content: toResurfaceMessageText(state),
		components: [],
	});
}
