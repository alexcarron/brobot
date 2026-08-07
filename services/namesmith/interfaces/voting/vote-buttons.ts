import { ButtonInteraction, ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButton, DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { PublishedName } from "../../types/published-name.types";
import { Rank, Ranks } from "../../types/vote.types";
import { voteName } from "../../workflows/voting/vote-name.workflow";
import { addSIfPlural, escapeDiscordMarkdown, joinLines, toListOfWords } from "../../../../utilities/string-manipulation-utils";
import { toRankEmoji } from "../../utilities/player-message.utility";

export function getVote1stButton(
	{publishedName}: {publishedName: PublishedName}
): DiscordButtonDefinition {
	return {
		label: '🥇 Vote 1st',
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
		label: '🥈 Vote 2nd',
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
		label: '🥉 Vote 3rd',
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
	return [...rankToVotedName].map(([rank, name]) =>
		`-# Your ${rank} place vote is ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`
	);
}

function toMissingRanksLine(missingRanks: Set<Rank>): string | null {
	if (missingRanks.size === 0) return null;
	const listOfMissingRanks = toListOfWords(Array.from(missingRanks));
	return `-# Vote for your ${listOfMissingRanks} favorite ${addSIfPlural('name', missingRanks.size)} to increase your vote's effectiveness.`;
}

function toEmptyRankLines(missingRanks: Set<Rank>): string[] {
	return Array.from(missingRanks).map(rank => `-# Your ${rank} place vote is now empty`);
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
		return await replyToInteraction(buttonInteraction,
			'Voting has ended. You can no longer vote on names.'
		);

	// Result should always return rankToVotedName, it will just be the existing votes if it fails
	const {rankToVotedName} = result;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	if (result.isRepeatedVote()) {
		return await replyToInteraction(buttonInteraction,
			`You already voted this name in ${rank} place.`,
			``,
			currentVoteLines,
		);
	}

	if (result.isInvalidSwitchedVote()) {
		const {rankLeftEmpty} = result;
		return await replyToInteraction(buttonInteraction,
			`You cannot switch this name's vote to ${rank} place without choosing a new ${rankLeftEmpty} place vote first.`,
			``,
			currentVoteLines,
		);
	}

	if (result.isOutOfOrderVote()) {
		const {missingRanks} = result;
		const listOfMissingRanks = toListOfWords(Array.from(missingRanks));

		const firstLine = missingRanks.size > 1
			? `You must vote names in ${listOfMissingRanks} place before making your ${rank} place vote.`
			: `You must vote a name in ${listOfMissingRanks} place before making your ${rank} place vote.`;

		await replyToInteraction(buttonInteraction,
			firstLine,
			``,
			currentVoteLines,
		);
		return;
	}

	const {missingRanks, otherRankToVotedName, publishedNamePreviouslyInRank, previousRankOfPublishedName} = result;
	const voteMissingRanksLine = toMissingRanksLine(missingRanks);

	if (publishedNamePreviouslyInRank === null && previousRankOfPublishedName === null) {
		return await replyToInteraction(buttonInteraction,
			`You voted this name in ${rank} place:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			currentVoteLines,
			voteMissingRanksLine,
		);
	}

	const otherVoteLines = toCurrentVoteLines(otherRankToVotedName);

	if (publishedNamePreviouslyInRank === null) {
		return await replyToInteraction(buttonInteraction,
			`You somehow illegally changed your vote for this name from ${previousRankOfPublishedName} place to ${rank} place, leaving ${previousRankOfPublishedName} place empty:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			`Contact the host to notify them of this bug`,
			``,
			otherVoteLines,
			voteMissingRanksLine,
		);
	}

	const originallyVotedName = publishedNamePreviouslyInRank.name;
	const originalVoteLine =
		`-# Your ${rank} place vote was originally for ${escapeDiscordMarkdown(originallyVotedName)}`;

	const rankIndex = Number(rank.charAt(0)) - 1;
	const lines = [
			...otherVoteLines.slice(0, rankIndex),
			originalVoteLine,
			...otherVoteLines.slice(rankIndex)
	];

	if (previousRankOfPublishedName !== null) {
		const switchedRankMessage = new DiscordButton({
			promptText: joinLines(
				`You switched this name's vote from ${previousRankOfPublishedName} to ${rank} place:`,
				`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
				``,
				lines,
				toEmptyRankLines(missingRanks),
			),
			label: "Undo",
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
			`You replaced your ${rank} place vote with a vote for this name:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			lines,
			voteMissingRanksLine,
		),
		label: "Undo",
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
		return await replyToInteraction(buttonInteraction,
			`Failed to undo your vote for this name. Please contact the host.`
		);
	}

	const redoResult = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPublishedName: votedPublishedName,
		rankVotingFor: previousRankOfPublishedName,
	});

	if (redoResult.isVotingClosed())
		return await replyToInteraction(buttonInteraction, 'Voting has ended. You can no longer change your votes.');

	const {rankToVotedName} = redoResult;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	await replyToInteraction(buttonInteraction,
		`You switched this name's vote back to ${previousRankOfPublishedName} place:`,
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
		return await replyToInteraction(buttonInteraction, 'Voting has ended. You can no longer change your votes.');

	const {rankToVotedName} = undoResult;
	const currentVoteLines = toCurrentVoteLines(rankToVotedName);

	await replyToInteraction(buttonInteraction,
		`You restored your previous ${rankVotedFor} place vote on this name:`,
		`> ${toRankEmoji(rankVotedFor)} ${escapeDiscordMarkdown(namePreviouslyInRank)}`,
		``,
		currentVoteLines,
	);
}
