import { ids } from "../../../bot-config/discord-ids";
import { sendMessageInChannel } from "../../../utilities/discord-action-utils";
import { escapeDiscordMarkdown } from "../../../utilities/string-manipulation-utils";
import { Player } from "../types/player.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";

/**
 * Sends a message to the 'published names' channel when a player publishes their name.
 * The message format is `<@player.id> has published their name:\n<player.currentName>`.
 * @param parameters - An object containing the following parameters:
 * @param parameters.player - The player that published their name.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPublishedNameMessage({player}: {
	player: Player;
}) {
	const publishedNamesChannel = await fetchNamesmithChannel(ids.namesmith.channels.PUBLISHED_NAMES);
	await sendMessageInChannel(publishedNamesChannel,
		`_ _`,
		`<@${player.id}> has published the following name:`,
		`> ${escapeDiscordMarkdown(player.publishedName!)}`
	);
}