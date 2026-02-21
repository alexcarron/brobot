import { ids } from "../../../../bot-config/discord-ids";
import { sendMessageInChannel } from "../../../../utilities/discord-action-utils";
import { Placement } from "../../types/vote.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { Duration } from '../../../../utilities/date-time-utils';
import { wait } from "../../../../utilities/realtime-utils";
import { isString } from "../../../../utilities/types/type-guards";
import { getPlacementMessageContents } from "./placement-message";

/**
 * Sends the display messages for announcing the winner after voting ends
 * @param parameters - An object containing the following parameters:
 * @param parameters.placements - The placements of all players in order of highest to lowest points
 */
export async function sendResultsDisplay(
	{placements}: {
		placements: Placement[];
}) {
	await sendWithDelay(`# The Results`);
	await sendWithDelay(
		`<@&${ids.namesmith.roles.smithedName}> <@&${ids.namesmith.roles.noName}>`,
		`Voting has ended. Each name now has a total score.`
	);
	await sendWithDelay(`You will NOW see the final rankings revealed from last place to 1st place.`);
	await sendWithDelay(`Preparing final standings…`);

	for (const placement of placements.reverse()) {
		let delay = {seconds: 10};
		switch (placement.rank) {
			case 1:
				delay = {seconds: 19};
				break;

			case 2:
				delay = {seconds: 16};
				break;
		
			case 3:
				delay = {seconds: 13};
				break;
				
			default:
				break;
		}
		
		await sendWithDelay(delay,
			getPlacementMessageContents(placement)
		);
	}
}

/**
 * Sends a message to the 'The Results' channel after waiting for a specified delay.
 * @param delay - The duration to wait before sending the message.
 * @param lines - The lines of the message to send.
 */
async function sendWithDelay(
	delay: Duration | 0 | string,
	...lines: string[]
) {
	const DEFAULT_DELAY = {seconds: 5};
	if (isString(delay)) {
		lines.unshift(delay);
		delay = DEFAULT_DELAY;
	}
	await wait(delay);
	const resultsChannel = await fetchNamesmithChannel(ids.namesmith.channels.THE_RESULTS);
	await sendMessageInChannel(resultsChannel, ...lines);
}