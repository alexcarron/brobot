import { ButtonInteraction, ButtonStyle, MessageCreateOptions, MessageFlags } from "discord.js";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { getAutoMineButton } from "./auto-mine-button";
import { getMineDeeperButton } from "./mine-deeper-button";
import { MiningSessionState } from "./mining-session-state";
import { getResurfaceButton } from "./resurface-button";
import { toInteractionReplyFromMessageCreateOptions } from "../../../../utilities/discord-action-utils";

/**
 * Returns the Resurface, Mine Deeper, and Auto-Mine button definitions, in that order, for the given mining session.
 * @param userID - The ID of the player who started the mining session.
 * @param state - The current mining session state.
 * @returns The button definitions.
 */
export function getMiningSessionButtons(userID: string, state: MiningSessionState): DiscordButtonDefinition[] {
	if (state.currentLayer === 1)
		return [
			getMineDeeperButton(userID, state, ButtonStyle.Secondary),
		];
	else
		return [
			getResurfaceButton(userID, state),
			getMineDeeperButton(userID, state),
			getAutoMineButton(userID, state),
		];
}

/**
 * Builds the message contents for the mining session message: the given text alongside the Resurface, Mine Deeper, and Auto-Mine buttons.
 * @param userID - The ID of the player who started the mining session.
 * @param state - The current mining session state.
 * @param promptText - The message text to show above the buttons.
 * @returns The message contents.
 */
export function getMiningSessionMessageContentsWithButtons(userID: string, state: MiningSessionState, promptText: string): MessageCreateOptions {
	return new DiscordButtons({
		promptText,
		buttons: getMiningSessionButtons(userID, state),
	}).getMessageContents();
}

/**
 * Checks whether the given button press came from the player who started the mining session.
 * @param userID - The ID of the player who started the mining session.
 * @param buttonInteraction - The button interaction to check.
 * @returns Whether the button press came from the session's owner.
 */
export function doesUserOwnMiningSessionOfButton(userID: string, buttonInteraction: ButtonInteraction): boolean {
	return buttonInteraction.user.id === userID;
}

/**
 * Sends the next mining session state as a new follow-up message, instead of editing the previous one, so the channel shows a fresh message with no "(edited)" tag.
 * @param buttonInteraction - The button interaction to follow up.
 * @param newContents - The message contents to send.
 */
export async function sendMiningSessionFollowUpMessage(buttonInteraction: ButtonInteraction, newContents: MessageCreateOptions): Promise<void> {
	if (!buttonInteraction.replied && !buttonInteraction.deferred) {
		await buttonInteraction.deferUpdate();
	}

	await buttonInteraction.followUp({
		...toInteractionReplyFromMessageCreateOptions(newContents),
		flags: MessageFlags.Ephemeral,
	});
}