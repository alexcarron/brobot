import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { toRankEmoji } from "../../utilities/player-message.utility";
import { clearMyVotes } from "../../workflows/voting/clear-my-votes.workflow";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { escapeDiscordMarkdown, joinLines } from "../../../../utilities/string-manipulation-utils";
import { voteName } from "../../workflows/voting/vote-name.workflow";
import { Rank, Ranks } from "../../types/vote.types";
import { PublishedName } from "../../types/published-name.types";
import { confirmInteraction } from "../../../../utilities/discord-interfaces/discord-interface-utils";

export const CLEAR_MY_VOTES_LABEL = `Clear My Votes`;
export const NO_VOTES_TO_DELETE_FEEDBACK = `You have not voted yet. You have no votes to delete.`;
export const CONFIRM_DELETE_VOTES_FEEDBACK = (rankToVotedName: Map<Rank, string>) => joinLines(
	`Are you sure you want to delete your current votes?`,
	[...rankToVotedName.entries()].map(([rank, name]) =>
		`> ${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
	),
);
export const DELETE_VOTES_LABEL = `Delete Votes`;
export const KEEP_VOTES_LABEL = `Keep Votes`;
export const CANCEL_DELETE_VOTES_FEEDBACK = (rankToVotedName: Map<Rank, string>) => joinLines(
	`Your votes have not been deleted. Your current votes are still the following:`,
	'>>> ' + [...rankToVotedName.entries()].map(([rank, name]) =>
		`${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
	),
);
export const DELETED_ALL_VOTES_FEEDBACK = `You have deleted all your votes.`;
export const UNDO_DELETE_VOTES_LABEL = `Undo`;
export const VOTING_ENDED_CANNOT_CHANGE_VOTES_FEEDBACK = `Voting has ended. You can no longer change your votes.`;
export const FAILED_TO_UNDO_VOTE_FEEDBACK = `Failed to undo your vote for this name. Please contact the host.`;
export const RECOVERED_DELETED_VOTES_FEEDBACK = `You have recovered your previously deleted votes:`;

export function getClearMyVotesButton() {
	return {
		label: CLEAR_MY_VOTES_LABEL,
		style: ButtonStyle.Danger,
		id: `clear-my-votes-button`,
		onButtonPressed: onClearMyVotesButtonPressed,
	}
}

async function onClearMyVotesButtonPressed(buttonInteraction: ButtonInteraction) {
	const {voteService} = getNamesmithServices();

	const voterUserID = buttonInteraction.user.id;
	const rankToVotedName = voteService.getRanksToVotedName(voterUserID);

	if (rankToVotedName.size === 0)
		return await replyToInteraction(buttonInteraction, NO_VOTES_TO_DELETE_FEEDBACK);

	await confirmInteraction({
		interactionToConfirm: buttonInteraction,
		confirmPromptText: CONFIRM_DELETE_VOTES_FEEDBACK(rankToVotedName),
		confirmButtonText: DELETE_VOTES_LABEL,
		confirmButtonStyle: ButtonStyle.Danger,
		cancelButtonText: KEEP_VOTES_LABEL,
		cancelButtonStyle: ButtonStyle.Secondary,
		onConfirm: onConfirmDeleteVotes,
		onCancel: CANCEL_DELETE_VOTES_FEEDBACK(rankToVotedName),
	});
}

async function onConfirmDeleteVotes(buttonInteraction: ButtonInteraction) {
	const voterUserID = buttonInteraction.user.id;
	const result = clearMyVotes({voterUserID});

	const {rankToVotedPublishedName} = result;

	const deleteConfirmationMessage = new DiscordButton({
		promptText: DELETED_ALL_VOTES_FEEDBACK,
		label: UNDO_DELETE_VOTES_LABEL,
		style: ButtonStyle.Secondary,
		id: `undo-delete-votes-${voterUserID}`,
		onButtonPressed: async (buttonInteraction) => {
			await onUndoDeleteVotesButtonPressed({buttonInteraction, rankToVotedPublishedName});
		}
	});
	await replyToInteraction(buttonInteraction, deleteConfirmationMessage.getMessageContents());
}

async function onUndoDeleteVotesButtonPressed(
	{buttonInteraction, rankToVotedPublishedName}: {
		buttonInteraction: ButtonInteraction,
		rankToVotedPublishedName: Map<Rank, PublishedName>
	}
) {
	const sortedRankNameEntries = [...rankToVotedPublishedName.entries()].sort(([rank1], [rank2]) => {
		const rankValue1 =
			rank1 === Ranks.FIRST ? 1 :
			rank1 === Ranks.SECOND ? 2 :
			rank1 === Ranks.THIRD ? 3 : 0;

		const rankValue2 =
			rank2 === Ranks.FIRST ? 1 :
			rank2 === Ranks.SECOND ? 2 :
			rank2 === Ranks.THIRD ? 3 : 0;

		return rankValue1 - rankValue2;
	});
	
	let rankToVotedName: Map<Rank, string> = new Map();
	for (const [rank, publishedName] of sortedRankNameEntries) {
		const undoVoteResult = voteName({
			voterUserID: buttonInteraction.user.id,
			votedPublishedName: publishedName,
			rankVotingFor: rank,
		});

		if (undoVoteResult.isVotingClosed())
			return await replyToInteraction(buttonInteraction, VOTING_ENDED_CANNOT_CHANGE_VOTES_FEEDBACK);

		if (undoVoteResult.isFailure()) {
			return await replyToInteraction(buttonInteraction, FAILED_TO_UNDO_VOTE_FEEDBACK);
		}

		const {rankToVotedName: newRankToVotedName} = undoVoteResult;
		rankToVotedName = newRankToVotedName;
	}

	return await replyToInteraction(buttonInteraction,
		RECOVERED_DELETED_VOTES_FEEDBACK,
		[...rankToVotedName.entries()].map(([rank, name]) =>
			`> ${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
		),
	);
}