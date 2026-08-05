import { DiscordAPIError } from "discord.js";
import { dmUser } from "../../../../utilities/discord-action-utils";
import { toggleRefillReminders } from "../../workflows/toggle-refill-reminders.workflow";
import { joinLines } from "../../../../utilities/string-manipulation-utils";

const NOT_A_PLAYER_TEXT = `You're not a player, so you can't toggle refill reminders.`;
const REMINDERS_ENABLED_TEXT = joinLines(
	`Refill reminders are now on.`, 
	`You will be DMed here when your refill cooldown expires.`
);
const REMINDERS_DISABLED_TEXT = joinLines(
	`Refill reminders are now off.`, 
	`You will no longer be DMed when your refill cooldown expires.`
);
const REMINDERS_COULD_NOT_BE_ENABLED_TEXT = joinLines(
	`Refill reminders couldn't be enabled because Brobot can't DM you.`, 
	`Enable direct messages from server members and try again.`
);

/**
 * Toggles a player's refill cooldown reminders and returns the text describing the outcome.
 * Enabling reminders sends a confirmation DM, which doubles as a check that the player's DMs are open - if it fails, reminders are left off and the player is told why.
 * @param userID - The Discord ID of the player toggling their refill reminders.
 * @returns The reply text describing the outcome.
 */
export async function handleToggleRefillReminders(userID: string): Promise<string> {
	const DISCORD_CANNOT_MESSAGE_USER_ERROR_CODE = 50007;
	const CANNOT_MESSAGE_USER_WITH_NO_MUTUAL_GUILDS_ERROR_CODE = 50278;

	const toggleResult = toggleRefillReminders({ playerID: userID });

	if (toggleResult.isNotAPlayer()) {
		return NOT_A_PLAYER_TEXT;
	}

	const { enabled } = toggleResult;

	if (!enabled) {
		return REMINDERS_DISABLED_TEXT;
	}

	try {
		await dmUser(userID, REMINDERS_ENABLED_TEXT);
	}
	catch (error) {
		if (
			error instanceof DiscordAPIError
			&& (
				error.code === DISCORD_CANNOT_MESSAGE_USER_ERROR_CODE
				|| error.code === CANNOT_MESSAGE_USER_WITH_NO_MUTUAL_GUILDS_ERROR_CODE
			)
		) {
			toggleRefillReminders({ playerID: userID });
			return REMINDERS_COULD_NOT_BE_ENABLED_TEXT;
		}

		throw error;
	}

	return REMINDERS_ENABLED_TEXT;
}
