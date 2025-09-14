import { ButtonInteraction, ButtonStyle } from "discord.js";
import { DiscordButton } from "../../../../utilities/discord-interface-utils";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { fetchNamesToVoteOnChannel } from "../../utilities/discord-fetch.utility";
import { Player, PlayerID } from "../../types/player.types";
import { attempt } from '../../../../utilities/error-utils';


/**
 * Handles a vote button press event. This is used to vote for a name submitted to the Names to Vote On channel.
 * @param options - An object with the following properties:
 * @param options.buttonInteraction - The interaction that triggered the event.
 * @param options.playerVotedForID - The ID of the player that was voted for.
 */
export const onVoteButtonPressed = async (
	{buttonInteraction, playerVotedForID}: {
		buttonInteraction: ButtonInteraction,
		playerVotedForID: PlayerID,
}) => {
	const userID = buttonInteraction.user.id;

	const { playerService, voteService } = getNamesmithServices();
	const playerName = playerService.getPublishedName(playerVotedForID);
	let feedbackMessage = `You have voted for ${playerName}!`;
	try {
		feedbackMessage = voteService.addVote({
			voterID: userID,
			playerVotedForID: playerVotedForID
		});
	}
	catch (error) {
		if (error instanceof Error === false)
			throw error;

		await buttonInteraction.reply({
			content: error.message, ephemeral: true
		});
		return;
	}

	await buttonInteraction.reply({ content: feedbackMessage, ephemeral: true });
}

const getPromptText = (player: Player) => `_ _\n${player.publishedName}`;

const createVoteButton = ({playerVotingFor}: {
	playerVotingFor: Player
}): DiscordButton => {
	return new DiscordButton({
		promptText: getPromptText(playerVotingFor),
		buttonLabel: 'Vote as Favorite Name',
		buttonID: `vote-button-${playerVotingFor.publishedName}`,
		buttonStyle: ButtonStyle.Secondary,
		onButtonPressed: (buttonInteraction) => onVoteButtonPressed({
			buttonInteraction,
			playerVotedForID: playerVotingFor.id
		}),
	});
}

export const sendVoteButton = async ({playerVotingFor}: {
	playerVotingFor: Player
}) => {
	const voteButton = createVoteButton({playerVotingFor});
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await voteButton.sendIn(namesToVoteOnChannel);
}

export const regenerateVoteButton = async ({playerVotingFor}: {
	playerVotingFor: Player
}) => {
	const voteButton = createVoteButton({playerVotingFor});
	const namesToVoteOnChannel = await fetchNamesToVoteOnChannel();
	await attempt(
		voteButton.regenerate({channel: namesToVoteOnChannel})
	).ignoreError().execute();
}