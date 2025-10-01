import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { getPlayerFromCommandParameter } from "../../services/namesmith/utilities/discord-action.utility";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";

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
	execute: async (interaction, {tokens}) => {
		await deferInteraction(interaction);

		const { playerService } = getNamesmithServices();

		const playerOrErrorMessage = await getPlayerFromCommandParameter({
			interaction,
			parameter: Parameters.PLAYER,
			playerService
		});

		if (typeof playerOrErrorMessage === "string") {
			const errorMessage = playerOrErrorMessage;
			return await replyToInteraction(interaction, errorMessage);
		}

		const player = playerOrErrorMessage;

		playerService.playerRepository.setTokens(player.id, tokens);

		return await replyToInteraction(interaction,
			`${playerOrErrorMessage.currentName}'s tokens have been set to: ${tokens}`
		);
	}
})