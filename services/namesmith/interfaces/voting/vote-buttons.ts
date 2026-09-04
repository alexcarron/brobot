import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { DiscordButton, DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { PublishedName } from "../../types/published-name.types";
import { Rank, Ranks } from "../../types/vote.types";
import { voteName } from "../../workflows/voting/vote-name.workflow";
import { addSIfPlural, escapeDiscordMarkdown, joinLines, toListOfWords } from "../../../../utilities/string-manipulation-utils";
import { toRankEmoji } from "../../utilities/player-message.utility";

export const VOTE_1ST_LABEL = `🥇 Vote 1st`;
export const VOTE_2ND_LABEL = `🥈 Vote 2nd`;
export const VOTE_3RD_LABEL = `🥉 Vote 3rd`;
export const UNDO_VOTE_LABEL = `Undo`;
export const VOTING_ENDED_CANNOT_VOTE_FEEDBACK = `Voting has ended. You can no longer vote on names.`;
export const VOTING_ENDED_CANNOT_CHANGE_VOTES_FEEDBACK = `Voting has ended. You can no longer change your votes.`;
export const FAILED_TO_UNDO_VOTE_FEEDBACK = `Failed to undo your vote for this name. Please contact the host.`;
export const CONTACT_HOST_ABOUT_BUG_FEEDBACK = `Contact the host to notify them of this bug`;

export const CURRENT_VOTE_TEXT = (
	{ rank, name }: { rank: Rank, name: string }
) => `-# Your ${rank} place vote is ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`;

export const MISSING_RANKS_TEXT = (missingRanks: Set<Rank>): string | null => {
	if (missingRanks.size === 0) return null;
	const listOfMissingRanks = toListOfWords(Array.from(missingRanks));
	return `-# Vote for your ${listOfMissingRanks} favorite ${addSIfPlural('name', missingRanks.size)} to increase your vote's effectiveness.`;
};

export const EMPTY_RANK_TEXT = (rank: Rank) => `-# Your ${rank} place vote is now empty`;

export const REPEATED_VOTE_FEEDBACK = (rank: Rank) => `You already voted this name in ${rank} place.`;

export const INVALID_SWITCHED_VOTE_FEEDBACK = (
	{ rank, rankLeftEmpty }: { rank: Rank, rankLeftEmpty: Rank }
) => `You cannot switch this name's vote to ${rank} place without choosing a new ${rankLeftEmpty} place vote first.`;

export const OUT_OF_ORDER_VOTE_FEEDBACK = (
	{ rank, missingRanks }: { rank: Rank, missingRanks: Set<Rank> }
) => {
	const listOfMissingRanks = toListOfWords(Array.from(missingRanks));
	return missingRanks.size > 1
		? `You must vote names in ${listOfMissingRanks} place before making your ${rank} place vote.`
		: `You must vote a name in ${listOfMissingRanks} place before making your ${rank} place vote.`;
};

export const VOTED_NAME_FEEDBACK = (rank: Rank) => `You voted this name in ${rank} place:`;

export const ILLEGAL_VOTE_CHANGE_FEEDBACK = (
	{ previousRankOfPublishedName, rank }: { previousRankOfPublishedName: Rank, rank: Rank }
) => `You somehow illegally changed your vote for this name from ${previousRankOfPublishedName} place to ${rank} place, leaving ${previousRankOfPublishedName} place empty:`;

export const ORIGINAL_VOTE_TEXT = (
	{ rank, originallyVotedName }: { rank: Rank, originallyVotedName: string }
) => `-# Your ${rank} place vote was originally for ${escapeDiscordMarkdown(originallyVotedName)}`;

export const SWITCHED_VOTE_FEEDBACK = (
	{ previousRankOfPublishedName, rank }: { previousRankOfPublishedName: Rank, rank: Rank }
) => `You switched this name's vote from ${previousRankOfPublishedName} to ${rank} place:`;

export const REPLACED_VOTE_FEEDBACK = (rank: Rank) => `You replaced your ${rank} place vote with a vote for this name:`;

export const SWITCHED_VOTE_BACK_FEEDBACK = (previousRankOfPublishedName: Rank) => `You switched this name's vote back to ${previousRankOfPublishedName} place:`;

export const RESTORED_VOTE_FEEDBACK = (rankVotedFor: Rank) => `You restored your previous ${rankVotedFor} place vote on this name:`;

export function getVote1stButton(
	{publishedName}: {publishedName: PublishedName}
): DiscordButtonDefinition {
	return {
		label: VOTE_1ST_LABEL,
		id: `vote-1st-${publishedName.id}`,
		style: ButtonStyle.Success,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({publishedName, buttonInteraction,
				rank: Ranks.FIRST,
			});
		}
	}
}

export function getVote2ndButton(
	{publishedName}: {publishedName: PublishedName}
): DiscordButtonDefinition {
	return {
		label: VOTE_2ND_LABEL,
		id: `vote-2nd-${publishedName.id}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({publishedName, buttonInteraction,
				rank: Ranks.SECOND,
			});
		}
	}
}

export function getVote3rdButton(
	{publishedName}: {publishedName: PublishedName}
): DiscordButtonDefinition {
	return {
		label: VOTE_3RD_LABEL,
		id: `vote-3rd-${publishedName.id}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({publishedName, buttonInteraction,
				rank: Ranks.THIRD,
			});
		}
	}
}

function toCurrentVoteLines(rankToVotedName: Map<Rank, string>): string[] {
	return [...rankToVotedName].map(([rank, name]) => CURRENT_VOTE_TEXT({ rank, name }));
}

function toEmptyRankLines(missingRanks: Set<Rank>): string[] {
	return Array.from(missingRanks).map(rank => EMPTY_RANK_TEXT(rank));
}

export async function onVoteButtonPressed(
	{publishedName, rank, buttonInteraction}: {
		publishedName: PublishedName,
		rank: Rank,
		buttonInteraction: any
	}
) {
	const name = publishedName.name;
	const result = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPublishedName: publishedName,
		rankVotingFor: rank,
	});

	if (result.isVotingClosed())
		return await replyToInteraction(buttonInteraction, VOTING_ENDED_CANNOT_VOTE_FEEDBACK);

	// Result should always return rankToVotedName, it will just be the existing votes if it fails
	const {rankToVotedName} = result;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	if (result.isRepeatedVote()) {
		return await replyToInteraction(buttonInteraction,
			REPEATED_VOTE_FEEDBACK(rank),
			``,
			currentVoteLines,
		);
	}

	if (result.isInvalidSwitchedVote()) {
		const {rankLeftEmpty} = result;
		return await replyToInteraction(buttonInteraction,
			INVALID_SWITCHED_VOTE_FEEDBACK({ rank, rankLeftEmpty }),
			``,
			currentVoteLines,
		);
	}

	if (result.isOutOfOrderVote()) {
		const {missingRanks} = result;

		await replyToInteraction(buttonInteraction,
			OUT_OF_ORDER_VOTE_FEEDBACK({ rank, missingRanks }),
			``,
			currentVoteLines,
		);
		return;
	}

	const {missingRanks, otherRankToVotedName, publishedNamePreviouslyInRank, previousRankOfPublishedName} = result;
	const voteMissingRanksLine = MISSING_RANKS_TEXT(missingRanks);

	if (publishedNamePreviouslyInRank === null && previousRankOfPublishedName === null) {
		return await replyToInteraction(buttonInteraction,
			VOTED_NAME_FEEDBACK(rank),
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			currentVoteLines,
			voteMissingRanksLine,
		);
	}

	const otherVoteLines = toCurrentVoteLines(otherRankToVotedName);

	if (publishedNamePreviouslyInRank === null) {
		return await replyToInteraction(buttonInteraction,
			ILLEGAL_VOTE_CHANGE_FEEDBACK({ previousRankOfPublishedName: previousRankOfPublishedName!, rank }),
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			CONTACT_HOST_ABOUT_BUG_FEEDBACK,
			``,
			otherVoteLines,
			voteMissingRanksLine,
		);
	}

	const originallyVotedName = publishedNamePreviouslyInRank.name;
	const originalVoteLine = ORIGINAL_VOTE_TEXT({ rank, originallyVotedName });

	const rankIndex = Number(rank.charAt(0)) - 1;
	const lines = [
			...otherVoteLines.slice(0, rankIndex),
			originalVoteLine,
			...otherVoteLines.slice(rankIndex)
	];

	if (previousRankOfPublishedName !== null) {
		const switchedRankMessage = new DiscordButton({
			promptText: joinLines(
				SWITCHED_VOTE_FEEDBACK({ previousRankOfPublishedName, rank }),
				`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
				``,
				lines,
				toEmptyRankLines(missingRanks),
			),
			label: UNDO_VOTE_LABEL,
			id: `undo-vote-switch-${rank}-${publishedName.id}-${originallyVotedName}`,
			style: ButtonStyle.Secondary,
			onButtonPressed: async (undoButtonInteraction) => {
				await onUndoVoteSwitchButtonPressed({
					buttonInteraction: undoButtonInteraction,
					publishedNamePreviouslyInRank,
					previousRankOfPublishedName,
					votedPublishedName: publishedName,
					votedName: name,
					rankSwitchedTo: rank,
				})
			}
		});

		return await replyToInteraction(buttonInteraction,
			switchedRankMessage.getMessageContents(),
		);
	}

	const replacedVoteMessage = new DiscordButton({
		promptText: joinLines(
			REPLACED_VOTE_FEEDBACK(rank),
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			lines,
			voteMissingRanksLine,
		),
		label: UNDO_VOTE_LABEL,
		id: `undo-vote-replacement-${rank}-${publishedName.id}-${originallyVotedName}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (undoButtonInteraction) => {
			await onUndoVoteReplacementButtonPressed({
				buttonInteraction: undoButtonInteraction,
				rankVotedFor: rank,
				publishedNamePreviouslyInRank,
				namePreviouslyInRank: originallyVotedName,
			})
		}
	});

	return await replyToInteraction(buttonInteraction,
		replacedVoteMessage.getMessageContents(),
	);
}

async function onUndoVoteSwitchButtonPressed(
	{buttonInteraction, publishedNamePreviouslyInRank, previousRankOfPublishedName, votedPublishedName, votedName, rankSwitchedTo}: {
		buttonInteraction: ButtonInteraction,
		publishedNamePreviouslyInRank: PublishedName,
		previousRankOfPublishedName: Rank,
		votedPublishedName: PublishedName,
		votedName: string,
		rankSwitchedTo: Rank,
	},
) {
	const undoResult = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPublishedName: publishedNamePreviouslyInRank,
		rankVotingFor: rankSwitchedTo,
	});

	if (undoResult.isFailure()) {
		return await replyToInteraction(buttonInteraction, FAILED_TO_UNDO_VOTE_FEEDBACK);
	}

	const redoResult = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPublishedName: votedPublishedName,
		rankVotingFor: previousRankOfPublishedName,
	});

	if (redoResult.isVotingClosed())
		return await replyToInteraction(buttonInteraction, VOTING_ENDED_CANNOT_CHANGE_VOTES_FEEDBACK);

	const {rankToVotedName} = redoResult;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	await replyToInteraction(buttonInteraction,
		SWITCHED_VOTE_BACK_FEEDBACK(previousRankOfPublishedName!),
		`> ${toRankEmoji(previousRankOfPublishedName!)} ${escapeDiscordMarkdown(votedName)}`,
		``,
		currentVoteLines,
	);
}

async function onUndoVoteReplacementButtonPressed(
	{buttonInteraction, rankVotedFor, publishedNamePreviouslyInRank, namePreviouslyInRank}: {
		buttonInteraction: ButtonInteraction,
		rankVotedFor: Rank,
		publishedNamePreviouslyInRank: PublishedName,
		namePreviouslyInRank: string,
	}
) {
	const undoResult = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPublishedName: publishedNamePreviouslyInRank,
		rankVotingFor: rankVotedFor,
	});

	if (undoResult.isVotingClosed())
		return await replyToInteraction(buttonInteraction, VOTING_ENDED_CANNOT_CHANGE_VOTES_FEEDBACK);

	const {rankToVotedName} = undoResult;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	await replyToInteraction(buttonInteraction,
		RESTORED_VOTE_FEEDBACK(rankVotedFor),
		`> ${toRankEmoji(rankVotedFor)} ${escapeDiscordMarkdown(namePreviouslyInRank)}`,
		``,
		currentVoteLines,
	);
}
