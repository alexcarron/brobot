import { ids } from "../../../../bot-config/discord-ids";
import { deleteAllMessagesInChannel } from "../../../../utilities/discord-action-utils";
import { logSetup } from "../../../../utilities/logging-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { openNamesToVoteOnChannel } from "../../utilities/discord-action.utility";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { regenerateInitialVotingMessage, sendInitialVotingMessage } from "./initial-voting-message";
import { regenerateNameEntryMessage, sendNameEntryMessage } from "./name-entry-message";

export async function sendVotingDisplay() {
	const { playerService } = getNamesmithServices();
	const players = playerService.getPlayers();
	
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await deleteAllMessagesInChannel(namesToVoteOnChannel);
	await openNamesToVoteOnChannel();

	await sendInitialVotingMessage();

	for (const player of players) {
		if (player.publishedName === null)
			continue;
		
		const finalizedName = player.publishedName;
		await sendNameEntryMessage({
			player: player,
			name: finalizedName
		});
	}
}

export async function regenerateVotingDisplay() {
	const regeneratePromises = [
		logSetup('[INITIAL VOTING MESSAGE]', regenerateInitialVotingMessage())
	];
	
	const { playerService } = getNamesmithServices();
	const players = playerService.getPlayers();

	regeneratePromises.push(
		...players.map(player => {
			if (player.publishedName === null)
				return Promise.resolve();
			
			const finalizedName = player.publishedName;
			return logSetup(`[VOTE ENTRY] ${finalizedName}`, regenerateNameEntryMessage({
				player: player,
				name: finalizedName
			}));
		})
	);

	await Promise.all(regeneratePromises);
}