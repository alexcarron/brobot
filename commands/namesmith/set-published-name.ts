import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { forcePlayerToPublishName } from "../../services/namesmith/mocks/mock-data/mock-players";
import { getInvalidPlayerMessageOrPlayer } from "../../services/namesmith/utilities/interface.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { escapeDiscordMarkdown, joinLines } from "../../utilities/string-manipulation-utils";
import { isString } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	CURRENT_NAME: new Parameter({
		type: ParameterTypes.STRING,
		name: "published-name",
		description: "The name to make the player publish"
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to set the published name of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "set-published-name",
	description: "Sets the published name of yourself or another player to the given characters",
	parameters: [
		Parameters.CURRENT_NAME,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {publishedName, player: playerResolvable}) => {
		const messageOrPlayer = await getInvalidPlayerMessageOrPlayer(interaction, playerResolvable, 'a published name');
		if (isString(messageOrPlayer)) return messageOrPlayer;

		const player = messageOrPlayer;
		const user = await fetchUser(player.id);
		forcePlayerToPublishName(player.id, publishedName);

		let firstPart = `${user} has been forced to publish the following name: `;
		if (interaction.user.id === player.id)
			firstPart = `You have been forced to publish the following name: `;

		return joinLines(
			firstPart, 
			`> ${escapeDiscordMarkdown(publishedName)}`
		);
	}
})