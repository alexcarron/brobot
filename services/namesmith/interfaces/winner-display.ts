import { Player } from "../types/player.types";
import { sendToTheWinnerChannel } from "../utilities/discord-action.utility";

/**
 * Sends the display messages for announcing the winner after voting ends
 * @param parameters - An object containing the following parameters:
 * @param parameters.winningPlayer - The player that won or null if nobody won
 */
export async function sendWinnerDisplay({winningPlayer}: {
	winningPlayer: Player | null;
}) {
	if (winningPlayer === null) {
		await sendToTheWinnerChannel(`The voting phase has ended and there was a tie!`);
	}
	else {
		await sendToTheWinnerChannel(`<@${winningPlayer.id}>!\nThe voting phase has ended and the winner is **${winningPlayer.publishedName}**!`);
	}
}