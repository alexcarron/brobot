import { ids } from "../../../bot-config/discord-ids";
import { sendMessageInChannel } from "../../../utilities/discord/message-utils";
import { joinLines } from "../../../utilities/string-manipulation-utils";
import { getNamesmithServices } from "../services/get-namesmith-services";
import { Placement, RANKS } from "../types/vote.types";
import { fetchNamesmithChannel, fetchNamesmithGuild } from "../utilities/discord-fetch.utility";
import { toRankEmoji } from "../utilities/player-message.utility";

const NAME_ARCHIVE_TEXT = (
	{guildName, theme, placements}: {
		guildName: string;
		theme: string | null;
		placements: Placement[];
	}
) => {
	let themeLine = undefined;
	if (theme) themeLine = `The theme was **${theme}**.`;

	return joinLines(
		`# ${guildName}`,
		themeLine,
		...placements.map(({rank, player, name}) =>
			rank <= 3
				? `> ${toRankEmoji(RANKS[rank - 1])} <@${player.id}> ${name}`
				: `>        <@${player.id}> ${name}`
		)
	)
};

function getNameArchiveMessageContents(
	{guildName, theme, placements}: {
		guildName: string;
		theme: string | null;
		placements: Placement[];
	}
): string {
	return NAME_ARCHIVE_TEXT({guildName, theme, placements});
}

/**
 * Sends a message to the 'Name Archive' channel, containing the theme and placements of the previous game.
 * The message is in the format of '# Guild Name', 'The theme was **theme**.', and then a list of placements in the format of '> **rank** <@playerId> **name**'.
 * If the rank is 1st, 2nd, or 3rd, it will be displayed with a corresponding emoji.
 */
export async function sendNameArchiveDisplay() {
	const {gameStateService, voteService} = getNamesmithServices();
	const namesmithGuild = await fetchNamesmithGuild();
	const guildName = namesmithGuild.name;
	const theme = gameStateService.getTheme();
	const placements = voteService.getPlacements();

	const messageContents = getNameArchiveMessageContents({guildName, theme, placements});
	
	const nameArchiveChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAME_ARCHIVE);
	await sendMessageInChannel(nameArchiveChannel, messageContents);
}