import { ButtonStyle } from "discord.js";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { DiscordButtonDefinition } from "../../../../utilities/discord-interfaces/discord-button";
import { Player } from "../../types/player.types";
import { Rank, Ranks } from "../../types/vote.types";
import { voteName } from "../../workflows/vote-name.workflow";
import { addSIfPlural, escapeDiscordMarkdown, toListOfWords } from "../../../../utilities/string-manipulation-utils";

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

export async function onVoteButtonPressed(
	{player, name, rank, buttonInteraction}: {
		player: Player,
		name: string,
		rank: Rank,
		buttonInteraction: any
	}
) {
	console.log(name);

	const result = voteName({
		voterUserID: buttonInteraction.user.id,
		votedPlayer: player,
		rankVotingFor: rank,
	});

	const {missingRanks, otherRankToVotedName, playerPreviouslyInRank} = result;

	const currentVoteLines = [...otherRankToVotedName].map(([rank, name]) =>
		`-# Your ${rank} place vote is ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`
	);

	const voteMissingRanksLine = missingRanks.size > 0
		? `-# Vote for your ${toListOfWords(Array.from(missingRanks))} favorite ${addSIfPlural('name', missingRanks.size)} to increase your vote's effectiveness.`
		: null;
	

	if (playerPreviouslyInRank === null) {
		return await replyToInteraction(buttonInteraction, 
			`You voted this name in ${rank} place:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			currentVoteLines,
			voteMissingRanksLine,
		);
	}
	else {
		const originalVoteLine = 
			`-# Your ${rank} place vote was originally ${escapeDiscordMarkdown(playerPreviouslyInRank.publishedName!)}`;

    const rankIndex = Number(rank.charAt(0)) - 1;
    const lines = [
        ...currentVoteLines.slice(0, rankIndex),
        originalVoteLine,
        ...currentVoteLines.slice(rankIndex)
    ];
		
		return await replyToInteraction(buttonInteraction, 
			`You replaced your previous ${rank} place vote with a ${rank} place vote for this name:`,
			`> ${toRankEmoji(rank)} ${escapeDiscordMarkdown(name)}`,
			``,
			lines,
			voteMissingRanksLine,
		);
	}
}