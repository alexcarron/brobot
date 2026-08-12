import { ids } from "../../../bot-config/discord-ids";
import { sendMessageInChannel } from "../../../utilities/discord/message-utils";
import { escapeDiscordMarkdown, toNumericOrdinal } from "../../../utilities/string-manipulation-utils";
import { Player } from "../types/player.types";
import { PublishedName } from "../types/published-name.types";
import { fetchNamesmithChannel } from "../utilities/discord-fetch.utility";

/**
 * Sends a message to the 'published names' channel when a player publishes a name.
 * The message states which published name slot was filled, and whether the player paid tokens to publish it.
 * @param parameters - An object containing the following parameters:
 * @param parameters.player - The player that published their name.
 * @param parameters.publishedName - The published name that was created.
 * @param parameters.tokensSpent - The number of tokens the player spent to publish the name.
 * @returns A promise that resolves once the message has been sent.
 */
export async function sendPublishedNameMessage({player, publishedName, tokensSpent}: {
	player: Player;
	publishedName: PublishedName;
	tokensSpent: number;
}) {
	const publishedNamesChannel = await fetchNamesmithChannel(ids.namesmith.channels.PUBLISHED_NAMES);
	const name = escapeDiscordMarkdown(publishedName.name);
	const slotOrdinal = toNumericOrdinal(publishedName.slotNumber);

	const message = tokensSpent > 0
		? `<@${player.id}> paid ${tokensSpent} tokens to publish **${name}** as their ${slotOrdinal} published name`
		: `<@${player.id}> published the name **${name}** as their ${slotOrdinal} published name`;

	await sendMessageInChannel(publishedNamesChannel, message);
}