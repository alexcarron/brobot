import { changeDiscordNameOfPlayer } from "../utilities/discord-action.utility";
import { NamesmithEvents, RelevantDataOf } from "./namesmith-events";

/**
 * Called when a player's name is changed.
 * Changes the player's current name to the new name in Discord.
 * @param data - The data passed to the event listener.
 * @param data.playerID - The ID of the player whose name was changed.
 * @param data.newName - The new name of the player.
 * @returns A promise that resolves once the player's name has been changed in Discord.
 */
export async function onNameChange({playerID, newName}:
	RelevantDataOf<typeof NamesmithEvents.NameChange>
) {
	await changeDiscordNameOfPlayer(playerID, newName);
}
