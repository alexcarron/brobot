import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";
import { escapeDiscordMarkdown, joinLines } from "../../utilities/string-manipulation-utils";
import { getInvalidPlayerMessageOrPlayer } from "../../services/namesmith/utilities/interface.utility";
import { isString } from "../../utilities/types/type-guards";

const Parameters = Object.freeze({
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to see the role of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "see-role",
	description: "Shows you the role of yourself or another player",
	parameters: [
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	execute: async (interaction, {player: playerID}) => {
		const { roleService } = getNamesmithServices();
		const messageOrPlayer = await getInvalidPlayerMessageOrPlayer(interaction, playerID, 'a role');
		if (isString(messageOrPlayer)) return messageOrPlayer;

		const player = messageOrPlayer;
		const user = await fetchUser(player.id);
		const role = roleService.getRoleOfPlayer(player);

		if (role !== null) {
			let firstLine = `${user}'s current role is the following:`;
			if (interaction.user.id === player.id)
				firstLine = `Your current role is the following:`;
	
			return joinLines(
				firstLine,
				`> ${escapeDiscordMarkdown(role.name)}`,
			);
		}
		else {
			if (interaction.user.id === player.id)
				return `You have not chosen a role yet.`;
			else
				return `${user} has not chosen a role yet.`;
		}
	}
})
