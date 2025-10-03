import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { resolveTargetPlayer } from "../../services/namesmith/utilities/interface.utility";

const Parameters = Object.freeze({
	TOKENS: new Parameter({
		type: ParameterTypes.NUMBER,
		name: "tokens",
		description: "The amount of tokens to set the player's token count to",
	}),
	PLAYER: new Parameter({
		type: ParameterTypes.STRING,
		name: "player",
		description: "The player to set the tokens of",
		isRequired: false,
	}),
});

export const command = new SlashCommand({
	name: "set-tokens",
	description: "Sets the tokens of yourself or another player to the given amount",
	parameters: [
		Parameters.TOKENS,
		Parameters.PLAYER,
	],
	required_servers: [ids.servers.NAMESMITH],
	isInDevelopment: true,
	execute: async (interaction, {tokens, player: playerResolvable}) => {
		const { playerService } = getNamesmithServices();

		const maybePlayer = await resolveTargetPlayer({
			playerService,
			interaction,
			givenPlayerResolvable: playerResolvable,
		});

		if (maybePlayer === null) {
			return `Could not find player. Given player identifier was an invalid name, username, or ID, and/or you are not a player.`;
		}

		const player = maybePlayer;

		playerService.playerRepository.setTokens(player.id, tokens);

		return `${maybePlayer.currentName}'s tokens have been set to: ${tokens}`;
	}
})