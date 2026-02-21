import { escapeDiscordMarkdown, joinLines, toNumericOrdinal } from "../../../../utilities/string-manipulation-utils";
import { Placement, Rank, RANKS, Ranks } from "../../types/vote.types";
import { toRankEmoji } from "../../utilities/feedback-message.utility";

function getNormalPlacementMessageContents(placement: Placement) {
	const rankOrdinal = toNumericOrdinal(placement.rank);
	const totalPoints = placement.points;
	const name = placement.name;
	const playerID = placement.player.id;
	const rankVotes = extractRankVotes(placement);

	const rankVoteParts = rankVotes.map(({ rank, votes }) => 
		`${toRankEmoji(rank)} x${votes}`
	);

	const rankVotesLine = rankVoteParts.length > 0
		? `> ${rankVoteParts.join('   ')}`
		: null;
		
	return joinLines(
		`_ _`,
		`**${rankOrdinal} (${totalPoints} pts)**`,
		`${escapeDiscordMarkdown(name)}`,
		rankVotesLine,
		`-# Created by <@${playerID}>`,
	)
}

function getTop3PlacementMessageContents(placement: Placement) {
	const rank = placement.rank;
	const rankOrdinal = toNumericOrdinal(placement.rank);
	const totalPoints = placement.points;
	const name = placement.name;
	const playerID = placement.player.id;
	const rankVotes = extractRankVotes(placement);

	const rankVoteLines = rankVotes.map(({ rank, votes, points }) => 
		`> ${toRankEmoji(rank)} x${votes} (${points} pts)`
	);

	return joinLines(
		`_ _`,
		`_ _`,
		`${'#'.repeat(rank)} ${toRankEmoji(RANKS[rank - 1])} ${rankOrdinal} Place (${totalPoints} points)`,
		`**${escapeDiscordMarkdown(name)}**`,
		...rankVoteLines,
		``,
		`-# Created by <@${playerID}>`,
	)
}

export function getPlacementMessageContents(placement: Placement) {
	if (placement.rank <= 3) {
		return getTop3PlacementMessageContents(placement);
	}
	return getNormalPlacementMessageContents(placement);
}

type RankVote = { rank: Rank; votes: number; points: number };
function extractRankVotes(placement: Placement): RankVote[] {
	const rankVotes: RankVote[] = [];
	if (placement.firstPlaceVotes > 0)
		rankVotes.push({
			rank: Ranks.FIRST,
			votes: placement.firstPlaceVotes,
			points: placement.firstPlacePoints,
		});

	if (placement.secondPlaceVotes > 0)
		rankVotes.push({
			rank: Ranks.SECOND,
			votes: placement.secondPlaceVotes,
			points: placement.secondPlacePoints,
		});

	if (placement.thirdPlaceVotes > 0)
		rankVotes.push({
			rank: Ranks.THIRD,
			votes: placement.thirdPlaceVotes,
			points: placement.thirdPlacePoints,
		});

	return rankVotes;
}