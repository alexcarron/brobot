import { Player } from "../types/player.types";
import { sendToPublishedNamesChannel } from '../utilities/discord-action.utility';

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
	await sendToPublishedNamesChannel(
		`<@${player.id}> has published their name:\n` +
		`\`${player.publishedName}\``
	);
}