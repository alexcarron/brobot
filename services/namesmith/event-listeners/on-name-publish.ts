import { sendPublishedNameMessage } from "../interfaces/published-name-message";
import { NamesmithEvents, RelevantDataOf } from "./namesmith-events";

/**
 * Called when a player's name is published
 * @param data - The data passed to the event listener.
 * @param data.player - The player whose name was published.
 * @param data.publishedName - The published name that was created.
 * @param data.tokensSpent - The number of tokens the player spent to publish the name.
 * @returns A promise that resolves once the published name message has been sent.
 */
export async function onNamePublish({player, publishedName, tokensSpent}:
	RelevantDataOf<typeof NamesmithEvents.PublishName>
) {
	await sendPublishedNameMessage({player, publishedName, tokensSpent});
}
