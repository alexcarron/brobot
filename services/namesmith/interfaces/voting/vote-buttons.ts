import { ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButton, DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { Player } from "../../types/player.types";
import { Rank, Ranks } from "../../types/vote.types";
import { voteName } from "../../workflows/vote-name.workflow";
import { addSIfPlural, escapeDiscordMarkdown, joinLines, toListOfWords } from "../../../../utilities/string-manipulation-utils";

export function getVote1stButton(
	{player, name}: {player: Player, name: string}
): DiscordButtonDefinition {
	return {
		label: '🥇 Vote 1st',
		id: `vote-1st-${name}`,
		style: ButtonStyle.Success,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({player, name, buttonInteraction,
				rank: Ranks.FIRST,
			});
		}
	}
}

export function getVote2ndButton(
	{player, name}: {player: Player, name: string}
): DiscordButtonDefinition {
	return {
		label: '🥈 Vote 2nd',
		id: `vote-2nd-${name}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({player, name, buttonInteraction,
				rank: Ranks.SECOND,
			});
		}
	}
}

export function getVote3rdButton(
	{player, name}: {player: Player, name: string}
): DiscordButtonDefinition {
	return {
		label: '🥉 Vote 3rd',
		id: `vote-3rd-${name}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction) => {
			await onVoteButtonPressed({player, name, buttonInteraction,
				rank: Ranks.THIRD,
			});
		}
	}
}

function toRankEmoji(rank: Rank): string {
	switch (rank) {
		case Ranks.FIRST: return '🥇';
		case Ranks.SECOND: return '🥈';
		case Ranks.THIRD: return '🥉';
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
	{player, name, rank, buttonInteraction}: {
		player: Player,
		name: string,
		rank: Rank,
		buttonInteraction: any
	}
) {
	const result = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPlayer: player,
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

	const {missingRanks, otherRankToVotedName, playerPreviouslyInRank, previousRankOfPlayer} = result;
	const voteMissingRanksLine = toMissingRanksLine(missingRanks);

	if (playerPreviouslyInRank === null && previousRankOfPlayer === null) {
		return await replyToInteraction(buttonInteraction, 
			`You voted this name in ${rank} place:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			currentVoteLines,
			voteMissingRanksLine,
		);
	}

	const otherVoteLines = toCurrentVoteLines(otherRankToVotedName);

	if (playerPreviouslyInRank === null) {
		return await replyToInteraction(buttonInteraction, 
			`You somehow illegally changed your vote for this name from ${previousRankOfPlayer} place to ${rank} place, leaving ${previousRankOfPlayer} place empty:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			`Contact the host to notify them of this bug`,
			``,
			otherVoteLines,
			voteMissingRanksLine,
		);
	}
	
	const originallyVotedName = playerPreviouslyInRank.publishedName!;
	const originalVoteLine = 
		`-# Your ${rank} place vote was originally for ${escapeDiscordMarkdown(originallyVotedName)}`;

	const rankIndex = Number(rank.charAt(0)) - 1;
	const lines = [
			...otherVoteLines.slice(0, rankIndex),
			originalVoteLine,
			...otherVoteLines.slice(rankIndex)
	];

	if (previousRankOfPlayer !== null) {
		const switchedRankMessage = new DiscordButton({
			promptText: joinLines(
				`You switched this name's vote from ${previousRankOfPlayer} to ${rank} place:`,
				`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
				``,
				lines,
				toEmptyRankLines(missingRanks),
			),
			label: "Undo",
			id: `undo-vote-switch-${rank}-${name}-${originallyVotedName}`,
			style: ButtonStyle.Secondary,
			onButtonPressed: async (undoButtonInteraction) => {
				const undoResult = voteName({
					voterUserID: buttonInteraction.user.id,
					votedPlayer: playerPreviouslyInRank.id,
					rankVotingFor: rank,
				});

				if (undoResult.isFailure()) {
					return await replyToInteraction(undoButtonInteraction,
						`Failed to undo your vote for this name. Please contact the host.`
					);
				}

				const redoResult = voteName({
					voterUserID: buttonInteraction.user.id,
					votedPlayer: player,
					rankVotingFor: previousRankOfPlayer,
				});

				if (redoResult.isVotingClosed())
					return await replyToInteraction(undoButtonInteraction, 'Voting has ended. You can no longer change your votes.');

				const {rankToVotedName} = redoResult;
				const currentVoteLines = toCurrentVoteLines(rankToVotedName);

				await replyToInteraction(undoButtonInteraction,
					`You switched this name's vote back to ${previousRankOfPlayer} place:`,
					`> ${toRankEmoji(previousRankOfPlayer!)} ${escapeDiscordMarkdown(name)}`,
					``,
					currentVoteLines,
				);
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
		id: `undo-vote-replacement-${rank}-${name}-${originallyVotedName}`,
		style: ButtonStyle.Secondary,
		onButtonPressed: async (undoButtonInteraction) => {
			const undoResult = voteName({
				voterUserID: buttonInteraction.user.id,
				votedPlayer: playerPreviouslyInRank,
				rankVotingFor: rank,
			});

			if (undoResult.isVotingClosed())
				return await replyToInteraction(undoButtonInteraction, 'Voting has ended. You can no longer change your votes.');

			const {rankToVotedName} = undoResult;
			const currentVoteLines = toCurrentVoteLines(rankToVotedName);
			
			await replyToInteraction(undoButtonInteraction,
				`You restored your previous ${rank} place vote on this name:`,
				`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(originallyVotedName)}`,
				``,					
				currentVoteLines,
			);
		}
	});

	return await replyToInteraction(buttonInteraction,
		replacedVoteMessage.getMessageContents(),
	);
}