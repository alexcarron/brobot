import { deleteAllMessagesInChannel } from "../../../../utilities/discord-action-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { openNamesToVoteOnChannel, sendToNamesToVoteOnChannel } from "../../utilities/discord-action.utility";
import { fetchNamesToVoteOnChannel } from "../../utilities/discord-fetch.utility";
import { regenerateVoteButton, sendVoteButton } from "./vote-button";

export const sendVotingMessages = async () => {
	const {playerService} = getNamesmithServices();

	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await deleteAllMessagesInChannel(namesToVoteOnChannel);
	await openNamesToVoteOnChannel();
	const players = playerService.getPlayersWithPublishedName();

	await sendToNamesToVoteOnChannel(
		`The game has ended and now it's time to vote on the players' final names!\n` +
		`# Finalized Names`
	);

	for (const player of players) {
		await sendVoteButton({playerVotingFor: player});
	}
}

export const regenerateVoteDisplay = async () => {
	const {playerService} = getNamesmithServices();
	const players = playerService.getPlayersWithPublishedName();

	for (const player of players) {
		await regenerateVoteButton({playerVotingFor: player});
	}
}