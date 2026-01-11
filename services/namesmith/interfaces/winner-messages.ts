import { ids } from "../../../bot-config/discord-ids";
import { joinLines } from "../../../utilities/string-manipulation-utils";
import { Player } from "../types/player.types";
import { sendToTheWinnerChannel } from "../utilities/discord-action.utility";

/**
 * Sends the display messages for announcing the winner after voting ends
 * @param parameters - An object containing the following parameters:
 * @param parameters.winningPlayer - The player that won or null if nobody won
 */
export async function sendWinnerMessages({winningPlayer}: {
	winningPlayer: Player | null;
}) {
	if (winningPlayer === null) {
		await sendToTheWinnerChannel(`The voting phase has ended and there was a tie!`);
	}
	else {
		await sendToTheWinnerChannel(joinLines(
			`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
			`The voting phase has ended and the winner is ${winningPlayer.publishedName} by <@${winningPlayer.id}>!`,
		));
	}
}