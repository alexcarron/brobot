import { ButtonInteraction, ButtonStyle } from "discord.js";
import { addReplyToInteraction, removeComponentsFromButtonInteractionMessage } from "../../../../utilities/discord-action-utils";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { handleToggleRefillReminders } from "./handle-toggle-refill-reminders";

const ENABLE_LABEL = "Enable Refill Reminders";
const DISABLE_LABEL = "Disable Refill Reminders";

function toButtonLabel(enabled: boolean): string {
	return enabled ? DISABLE_LABEL : ENABLE_LABEL;
}

/**
 * Returns a button definition that toggles the pressing player's refill cooldown reminders, labeled to reflect their current setting.
 * @param enabled - Whether the player currently has refill reminders enabled.
 * @returns The button definition.
 */
export function getRefillReminderToggleButton(enabled: boolean) {
	return {
		label: toButtonLabel(enabled),
		style: ButtonStyle.Secondary,
		id: `refill-reminder-toggle-button`,
		onButtonPressed: onRefillReminderToggleButtonPressed,
	}
}

async function onRefillReminderToggleButtonPressed(buttonInteraction: ButtonInteraction) {
	const { playerService } = getNamesmithServices();
	const userID = buttonInteraction.user.id;
	
	await removeComponentsFromButtonInteractionMessage(buttonInteraction);

	const replyText = await handleToggleRefillReminders(userID);

	const refillReminderToggleButton = new DiscordButton({
		promptText: replyText,
		...getRefillReminderToggleButton(playerService.hasRefillReminderEnabled(userID)),
	});

	await addReplyToInteraction(buttonInteraction, refillReminderToggleButton.getMessageContents());
}
