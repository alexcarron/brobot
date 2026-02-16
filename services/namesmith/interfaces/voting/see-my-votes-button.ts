import { ButtonInteraction, ButtonStyle } from "discord.js";
import { seeMyVotes } from "../../workflows/voting/see-my-votes.workflow";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { toRankEmoji } from "../../utilities/feedback-message.utility";

export function getSeeMyVotesButton() {
	return {
		label: 'See My Votes',
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
		return await replyToInteraction(buttonInteraction, `You have not voted yet.`);
	
	return await replyToInteraction(buttonInteraction, 
		`Your current votes are the following:`,
		[...rankToVotedName.entries()].map(([rank, name]) => 
			`> ${toRankEmoji(rank)} ${rank} – ${name}`
		),
	);
}