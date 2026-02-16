import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { toRankEmoji } from "../../utilities/feedback-message.utility";
import { confirmInteraction } from "../../../../utilities/discord-interfaces/discord-interface";
import { clearMyVotes } from "../../workflows/voting/clear-my-votes.workflow";
import { DiscordButton } from "../../../../utilities/discord-interfaces/discord-button";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { escapeDiscordMarkdown, joinLines } from "../../../../utilities/string-manipulation-utils";
import { voteName } from "../../workflows/voting/vote-name.workflow";
import { Rank, Ranks } from "../../types/vote.types";
import { Player } from "../../types/player.types";

export function getClearMyVotesButton() {
	return {
		label: 'Clear My Votes',
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
		return await replyToInteraction(buttonInteraction, `You have not voted yet. You have no votes to delete.`);
	
	await confirmInteraction({
		interactionToConfirm: buttonInteraction,
		confirmPromptText: joinLines(
			`Are you sure you want to delete your current votes?`,
			[...rankToVotedName.entries()].map(([rank, name]) => 
				`> ${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
			),
		),
		confirmButtonText: `Delete Votes`,
		confirmButtonStyle: ButtonStyle.Danger,
		cancelButtonText: `Keep Votes`,
		cancelButtonStyle: ButtonStyle.Secondary,
		onConfirm: onConfirmDeleteVotes,
		onCancel: joinLines(
			`Your votes have not been deleted. Your current votes are still the following:`,
			'>>> ' + [...rankToVotedName.entries()].map(([rank, name]) => 
				`${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
			),
		),
	});
}

async function onConfirmDeleteVotes(buttonInteraction: ButtonInteraction) {
	const voterUserID = buttonInteraction.user.id;
	const result = clearMyVotes({voterUserID});

	const {rankToVotedPlayer} = result;

	const deleteConfirmationMessage = new DiscordButton({
		promptText: `You have deleted all your votes.`,
		label: 'Undo',
		style: ButtonStyle.Secondary,
		id: `undo-delete-votes-${voterUserID}`,
		onButtonPressed: async (buttonInteraction) => {
			await onUndoDeleteVotesButtonPressed({buttonInteraction, rankToVotedPlayer});
		}
	});
	await replyToInteraction(buttonInteraction, deleteConfirmationMessage.getMessageContents());
}

async function onUndoDeleteVotesButtonPressed(
	{buttonInteraction, rankToVotedPlayer}: {
		buttonInteraction: ButtonInteraction,
		rankToVotedPlayer: Map<Rank, Player>
	}
) {
	const sortedRankNameEntries = [...rankToVotedPlayer.entries()].sort(([rank1], [rank2]) => {
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
	for (const [rank, name] of sortedRankNameEntries) {
		const undoVoteResult = voteName({
			voterUserID: buttonInteraction.user.id,
			votedPlayer: name,
			rankVotingFor: rank,
		});

		if (undoVoteResult.isVotingClosed())
			return await replyToInteraction(buttonInteraction, 'Voting has ended. You can no longer change your votes.');

		if (undoVoteResult.isFailure()) {
			return await replyToInteraction(buttonInteraction,
				`Failed to undo your vote for this name. Please contact the host.`
			);
		}

		const {rankToVotedName: newRankToVotedName} = undoVoteResult;
		rankToVotedName = newRankToVotedName;
	}

	return await replyToInteraction(buttonInteraction, 
		`You have recovered your previously deleted votes:`,
		[...rankToVotedName.entries()].map(([rank, name]) => 
			`> ${toRankEmoji(rank)} ${rank} – ${escapeDiscordMarkdown(name)}`
		),
	);
}