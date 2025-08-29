import { deleteAllMessagesInChannel } from "../../../utilities/discord-action-utils";
import { PlayerService } from "../services/player.service"
import { openNamesToVoteOnChannel, sendToNamesToVoteOnChannel } from "../utilities/discord-action.utility";
import { fetchNamesToVoteOnChannel } from "../utilities/discord-fetch.utility";
import { regenerateVoteButton, sendVoteButton } from "./vote-button";

export const sendVotingDisplay = async ({playerService}: {
	playerService: PlayerService
}) => {
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

export const regenerateVoteDisplay = async ({playerService}: {
	playerService: PlayerService
}) => {
	const players = playerService.getPlayersWithPublishedName();

	for (const player of players) {
		await regenerateVoteButton({playerVotingFor: player});
	}
}