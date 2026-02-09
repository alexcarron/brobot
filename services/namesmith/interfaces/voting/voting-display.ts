import { ids } from "../../../../bot-config/discord-ids";
import { deleteAllMessagesInChannel } from "../../../../utilities/discord-action-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { openNamesToVoteOnChannel } from "../../utilities/discord-action.utility";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { sendInitialVotingMessage } from "./initial-voting-message";
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
	const { playerService } = getNamesmithServices();
	const players = playerService.getPlayers();
	for (const player of players) {
		if (player.publishedName === null)
			continue;
		
		const finalizedName = player.publishedName;
		await regenerateNameEntryMessage({
			player: player,
			name: finalizedName
		});
	}
}