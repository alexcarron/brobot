import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { getInvalidPlayerMessageOrPlayer } from "../../services/namesmith/utilities/interface.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { escapeDiscordMarkdown, joinLines } from "../../utilities/string-manipulation-utils";
import { isString } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to see the current name of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "see-current-name",
	description: "Shows you the current name of yourself or another player",
	parameters: [
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	execute: async (interaction, {player: playerID}) => {
		const { playerService } = getNamesmithServices();
		const messageOrPlayer = await getInvalidPlayerMessageOrPlayer(interaction, playerID, 'a current name');
		if (isString(messageOrPlayer)) return messageOrPlayer;

		const player = messageOrPlayer;
		const user = await fetchUser(player.id);
		const currentName = playerService.getCurrentName(player.id);

		let firstLine = `${user}'s current name contains the following characters:`;
		if (interaction.user.id === player.id)
			firstLine = `Your current name contains the following characters:`;

		return joinLines(
			firstLine,
			`> ${escapeDiscordMarkdown(currentName)}_ _`,
		);
	}
})