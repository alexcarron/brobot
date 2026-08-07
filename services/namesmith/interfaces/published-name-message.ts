import { ids } from "../../../bot-config/discord-ids";
import { sendMessageInChannel } from "../../../utilities/discord-action-utils";
import { escapeDiscordMarkdown } from "../../../utilities/string-manipulation-utils";
import { Player } from "../types/player.types";
import { PublishedName } from "../types/published-name.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";

/**
 * Sends a message to the 'published names' channel when a player publishes a name.
 * The message format is `<@player.id> published the name **<publishedName.name>**`.
 * @param parameters - An object containing the following parameters:
 * @param parameters.player - The player that published their name.
 * @param parameters.publishedName - The published name that was created.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPublishedNameMessage({player, publishedName}: {
	player: Player;
	publishedName: PublishedName;
}) {
	const publishedNamesChannel = await fetchNamesmithChannel(ids.namesmith.channels.PUBLISHED_NAMES);
	await sendMessageInChannel(publishedNamesChannel,
		`<@${player.id}> published the name **${escapeDiscordMarkdown(publishedName.name)}**`
	);
}