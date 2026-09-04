import { ButtonInteraction, ButtonStyle } from "discord.js";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { doesUserOwnMiningSessionOfButton } from "./mining-session-buttons";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { NOT_SESSION_OWNER_FEEDBACK } from "./mining-message-lines";
import { STOP_AUTO_MINE_BUTTON_LABEL } from "./mining-button-labels";

export type AutoMineState = {
	isStopped: boolean;
	/** Resolves the in-progress wait immediately so the auto-mine loop can react to a stop without finishing the full interval. */
	resolveWaitIntervalEarly: () => void;
};

/**
 * Returns the button definition that stops an in-progress auto-mine loop.
 * @param userID - The ID of the player who started the mining session.
 * @param autoMineState - The mutable state tracking whether the auto-mine loop has been stopped.
 * @returns The button definition.
 */
export function getStopButton(userID: string, autoMineState: AutoMineState): DiscordButtonDefinition {
	return {
		id: `mine-stop-auto-${userID}`,
		label: STOP_AUTO_MINE_BUTTON_LABEL,
		style: ButtonStyle.Danger,
		onButtonPressed: (stopInteraction) => onStopAutoMineButtonPressed(stopInteraction, userID, autoMineState),
	};
}

async function onStopAutoMineButtonPressed(
	buttonInteraction: ButtonInteraction, userID: string, autoMineState: AutoMineState
): Promise<void> {
	if (!doesUserOwnMiningSessionOfButton(userID, buttonInteraction)) {
		await replyToInteraction(buttonInteraction, NOT_SESSION_OWNER_FEEDBACK);
		return 
	}

	autoMineState.isStopped = true;
	autoMineState.resolveWaitIntervalEarly();
	
	await buttonInteraction.deferUpdate();
}
