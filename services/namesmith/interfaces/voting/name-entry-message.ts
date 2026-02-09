import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { ids } from "../../../../bot-config/discord-ids";
import { getVote1stButton, getVote2ndButton, getVote3rdButton } from "./vote-buttons";
import { Player } from "../../types/player.types";
import { ignoreError } from "../../../../utilities/error-utils";

export function createNameEntryInterface(
	{ player, name }: {
		player: Player, 
		name: string
	}
): DiscordButtons {
	return new DiscordButtons({
		promptText: `_ _\n${name}`,
		buttons: [
			getVote1stButton({player, name}),
			getVote2ndButton({player, name}),
			getVote3rdButton({player, name}),
		]
	});
}

export async function sendNameEntryMessage({ player, name }: {player: Player, name: string}) {
	const nameEntryInterface = createNameEntryInterface({ player, name });
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await nameEntryInterface.sendIn(namesToVoteOnChannel);
}

export async function regenerateNameEntryMessage({ player, name }: {player: Player, name: string}) {
	const nameEntryInterface = createNameEntryInterface({ player, name });
	const namesToVoteOnChannel = await fetchNamesmithChannel(ids.namesmith.channels.NAMES_TO_VOTE_ON);
	await ignoreError(nameEntryInterface.regenerate({channel: namesToVoteOnChannel}));
}