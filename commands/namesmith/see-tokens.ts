import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";
import { fetchPlayerAutocompleteChoices } from "../../services/namesmith/utilities/player.utility";
import { fetchUser } from "../../utilities/discord-fetch-utils";

const Parameters = Object.freeze({
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to see the tokens of",
		isRequired: false,
		autocomplete: fetchPlayerAutocompleteChoices,
	}),
});

export const command = new SlashCommand({
	name: "see-tokens",
	description: "Shows you the tokens of yourself or another player",
	parameters: [
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	execute: async (interaction, {player: playerID}) => {
		const { playerService } = getNamesmithServices();

		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerID,
		});

		if (maybePlayer === null) {
			if (interaction.user.id === playerID || playerID === null) {
				return `You are not a player, so you do not have any tokens.`;
			}
			else {
				return `The given user is not a player, so they do not have any tokens.`;
			}
		}

		const player = maybePlayer;
		const user = await fetchUser(player.id);
		const tokens = playerService.getTokens(player.id);

		let firstPart = `${user} has`;
		if (interaction.user.id === player.id)
			firstPart = `You have`;

		return `${firstPart} **${tokens} tokens**.`; 
	}
})