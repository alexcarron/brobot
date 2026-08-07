import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { ids } from "../../../../bot-config/discord-ids";
import { getVote1stButton, getVote2ndButton, getVote3rdButton } from "./vote-buttons";
import { PublishedName } from "../../types/published-name.types";
import { ignoreError } from "../../../../utilities/error-utils";
import { toDisplayedName } from "../../utilities/player-message.utility";

export function createNameEntryInterface(
	{ publishedName }: {
		publishedName: PublishedName
	}
): DiscordButtons {
	return new DiscordButtons({
		promptText: `_ _\n${toDisplayedName(publishedName.name)}`,
		buttons: [
			getVote1stButton({publishedName}),
			getVote2ndButton({publishedName}),
			getVote3rdButton({publishedName}),
		]
	});
}

export async function sendNameEntryMessage({ publishedName }: {publishedName: PublishedName}) {
	const nameEntryInterface = createNameEntryInterface({ publishedName });
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await nameEntryInterface.sendIn(namesToVoteOnChannel);
}

export async function regenerateNameEntryMessage({ publishedName }: {publishedName: PublishedName}) {
	const nameEntryInterface = createNameEntryInterface({ publishedName });
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await ignoreError(nameEntryInterface.regenerate({channel: namesToVoteOnChannel}));
}
