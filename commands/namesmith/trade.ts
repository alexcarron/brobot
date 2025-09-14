import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterType } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { sendTradeMessage } from "../../services/namesmith/interfaces/trading/trade-message";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerInitiatedTradeError, NonPlayerReceivedTradeError, TradeBetweenSamePlayersError } from "../../services/namesmith/utilities/error.utility";
import { initiateTrade } from "../../services/namesmith/workflows/trading/initiate-trade.workflow";
import { getCharacterDifferencesInStrings as getCharacterDifferences } from "../../utilities/data-structure-utils";
import { deferInteraction, replyToInteraction } from "../../utilities/discord-action-utils";
import { getRequiredStringParam, getRequiredUserParam } from "../../utilities/discord-fetch-utils";

const Parameters = Object.freeze({
	PLAYER_TRADING_WITH: new Parameter({
		type: ParameterType.USER,
		name: "player-trading-with",
		description: "The player to trade with",
	}),
	CHARACTERS_GIVING: new Parameter({
		type: ParameterType.STRING,
		name: "characters-giving",
		description: "The characters to give to the player you are trading with",
	}),
	CHARACTERS_RECEIVING: new Parameter({
		type: ParameterType.STRING,
		name: "characters-receiving",
		description: "The characters to receive from the player you are trading with",
	}),
});

export const command = new SlashCommand({
	name: "trade",
	description: "Request to trade characters with another player",
	required_servers: [ids.servers.NAMESMITH],
	required_channels: [ids.namesmith.channels.TRADE_CHARACTERS],
	parameters: [
		Parameters.PLAYER_TRADING_WITH,
		Parameters.CHARACTERS_GIVING,
		Parameters.CHARACTERS_RECEIVING,
	],
	isInDevelopment: true,
	execute: async (interaction) => {
		await deferInteraction(interaction);

		const initiatingPlayerID = interaction.user.id;
		const recipientPlayerID = getRequiredUserParam(
			interaction, Parameters.PLAYER_TRADING_WITH.name
		).id;

		const offeredCharacters = getRequiredStringParam(interaction, Parameters.CHARACTERS_GIVING.name);
		const requestedCharacters = getRequiredStringParam(interaction, Parameters.CHARACTERS_RECEIVING.name);

		const tradeResult = initiateTrade({
			...getNamesmithServices(),
			initiatingPlayer: initiatingPlayerID,
			recipientPlayer: recipientPlayerID,
			offeredCharacters,
			requestedCharacters,
		});

		if (tradeResult instanceof NonPlayerInitiatedTradeError) {
			return await replyToInteraction(interaction,
				`You're not a player, so you can't initiate a trade.`
			);
		}
		else if (tradeResult instanceof NonPlayerReceivedTradeError) {
			return await replyToInteraction(interaction,
				`You can only trade with players. <@${recipientPlayerID}> is not a player.`
			);
		}
		else if (tradeResult instanceof TradeBetweenSamePlayersError) {
			return await replyToInteraction(interaction,
				`You can't trade with yourself.`
			);
		}
		else if (tradeResult instanceof MissingOfferedCharactersError) {
			const { player, offeredCharacters } = tradeResult.relevantData;
			const { missingCharacters } = getCharacterDifferences(offeredCharacters, player.inventory);

			return await replyToInteraction(interaction,
				`You are missing ${missingCharacters.length} characters you offered for this trade:\n` +
				missingCharacters.join('')
			);
		}
		else if (tradeResult instanceof MissingRequestedCharactersError) {
			const { player, requestedCharacters } = tradeResult.relevantData;
			const { missingCharacters } = getCharacterDifferences(requestedCharacters, player.inventory);

			return await replyToInteraction(interaction,
				`<@${player.id}> is missing ${missingCharacters.length} characters you requested for this trade:\n` +
				missingCharacters.join('')
			);
		}

		const {trade} = tradeResult;

		await replyToInteraction(interaction,
			`You requested to make the following trade with <@${recipientPlayerID}>.`
		);
		await sendTradeMessage({
			...getNamesmithServices(),
			trade
		});
	},
})