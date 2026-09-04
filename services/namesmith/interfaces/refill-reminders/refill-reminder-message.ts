import { DiscordAPIError } from "discord.js";
import { dmUser } from "../../../../utilities/discord/message-utils";
import { logError } from "../../../../utilities/logging-utils";
import { ids } from "../../../../bot-config/discord-ids";
import { sendToNamesmithChannel } from "../../utilities/discord-action.utility";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { joinLines } from "../../../../utilities/string-manipulation-utils";

export const REFILL_READY_TEXT = joinLines(
	`Your refill is ready.`,
	`Claim it with \`/claim-refill\`.`
);
export const REFILL_REMINDER_AUTO_DISABLED_NOTICE_TEXT = (playerID: string) => joinLines(
	`<@${playerID}> Your refill reminders have been turned off because Brobot couldn't DM you.`,
	`Enable direct messages from server members and toggle your reminders back on if you want them again.`
);

/**
 * Builds the DM sent to a player when their refill cooldown expires.
 * @returns The contents of the reminder DM.
 */
export function getRefillReminderDMText(): string {
	return REFILL_READY_TEXT;
}

/**
 * Builds the notice posted in the claim-refill channel when a player's refill reminders get auto-disabled because their DMs are closed.
 * @param playerID - The Discord ID of the player whose reminders were disabled.
 * @returns The contents of the notice.
 */
export function getRefillReminderAutoDisabledNoticeText(playerID: string): string {
	return REFILL_REMINDER_AUTO_DISABLED_NOTICE_TEXT(playerID);
}

/**
 * Sends the reminder DM to a player whose refill cooldown has just expired.
 * If the player's DMs are closed, their refill reminders are disabled and a notice is posted in the claim-refill channel instead, since the DM that would have told them is exactly what failed.
 * @param playerID - The Discord ID of the player to remind.
 * @returns A promise that resolves once the reminder (or its fallback notice) has been sent.
 */
export async function sendRefillReminderDM(playerID: string): Promise<void> {
	const DISCORD_CANNOT_MESSAGE_USER_ERROR_CODE = 50007;
	const CANNOT_MESSAGE_USER_WITH_NO_MUTUAL_GUILDS_ERROR_CODE = 50278;

	try {
		await dmUser(playerID, getRefillReminderDMText());
	}
	catch (error) {
		if (
			error instanceof DiscordAPIError
			&& (
				error.code === DISCORD_CANNOT_MESSAGE_USER_ERROR_CODE
				|| error.code === CANNOT_MESSAGE_USER_WITH_NO_MUTUAL_GUILDS_ERROR_CODE
			)
		) {
			logError(`RefillReminderMessage: could not DM player ${playerID}, their DMs are closed or they share no server with the bot. Disabling their refill reminders.`);

			const { playerService } = getNamesmithServices();
			playerService.setRefillReminderEnabled(playerID, false);

			await sendToNamesmithChannel(
				ids.namesmith.channels.CLAIM_REFILL,
				getRefillReminderAutoDisabledNoticeText(playerID)
			);
			return;
		}

		logError(`RefillReminderMessage: failed to send refill reminder to player ${playerID}.`, error as Error);
	}
}
