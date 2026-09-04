import { ButtonInteraction, ButtonStyle } from "discord.js";
import { seeMyVotes } from "../../workflows/voting/see-my-votes.workflow";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { toRankEmoji } from "../../utilities/player-message.utility";

export const SEE_MY_VOTES_LABEL = `See My Votes`;
export const NOT_VOTED_YET_FEEDBACK = `You have not voted yet.`;
export const CURRENT_VOTES_FEEDBACK = `Your current votes are the following:`;

export function getSeeMyVotesButton() {
	return {
		label: SEE_MY_VOTES_LABEL,
		style: ButtonStyle.Success,
		id: `see-my-votes-button`,
		onButtonPressed: onSeeMyVotesButtonPressed,
	}
}

async function onSeeMyVotesButtonPressed(buttonInteraction: ButtonInteraction) {
	const voterUserID = buttonInteraction.user.id;
	const result = seeMyVotes({voterUserID});
	const {rankToVotedName} = result;

	if (rankToVotedName.size === 0)
		return await replyToInteraction(buttonInteraction, NOT_VOTED_YET_FEEDBACK);

	return await replyToInteraction(buttonInteraction,
		CURRENT_VOTES_FEEDBACK,
		[...rankToVotedName.entries()].map(([rank, name]) => 
			`> ${toRankEmoji(rank)} ${rank} – ${name}`
		),
	);
}