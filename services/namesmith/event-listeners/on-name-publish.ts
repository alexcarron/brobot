import { sendPublishedNameMessage } from "../interfaces/published-name-message";
import { NamesmithEvents, RelevantDataOf } from "./namesmith-events";

/**
 * Called when a player's name is published
 * @param data - The data passed to the event listener.
 * @param data.player - The player whose name was published.
 * @returns A promise that resolves once the player's name has been changed in Discord.
 */
export async function onNamePublish({player}:
	RelevantDataOf<typeof NamesmithEvents.PublishName>
) {
	await sendPublishedNameMessage({player});
}
