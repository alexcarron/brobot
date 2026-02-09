import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { forcePlayerToChangeName } from "../../services/namesmith/mocks/mock-data/mock-players";
import { getInvalidPlayerMessageOrPlayer } from "../../services/namesmith/utilities/interface.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { escapeDiscordMarkdown, joinLines } from "../../utilities/string-manipulation-utils";
import { isString } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	CURRENT_NAME: new Parameter({
		type: ParameterTypes.STRING,
		name: "current-name",
		description: "The current name to give to the player"
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to set the current name of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "set-current-name",
	description: "Sets the current name of yourself or another player to the given characters",
	parameters: [
		Parameters.CURRENT_NAME,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {currentName, player: playerResolvable}) => {
		const messageOrPlayer = await getInvalidPlayerMessageOrPlayer(interaction, playerResolvable, 'a current name');
		if (isString(messageOrPlayer)) return messageOrPlayer;

		const player = messageOrPlayer;
		const user = await fetchUser(player.id);
		forcePlayerToChangeName(player.id, currentName);

		let firstPart = `${user}'s current name has been set to: `;
		if (interaction.user.id === player.id)
			firstPart = `Your current name has been set to: `;

		return joinLines(
			firstPart, 
			`> ${escapeDiscordMarkdown(currentName)}`
		);
	}
})