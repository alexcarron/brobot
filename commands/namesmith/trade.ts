import { ids } from "../../bot-config/discord-ids";
import { Parameter, ParameterTypes } from "../../services/command-creation/parameter";
import { SlashCommand } from "../../services/command-creation/slash-command";
import { sendTradeMessage } from "../../services/namesmith/interfaces/trading/trade-message";
import { getNamesmithServices } from "../../services/namesmith/services/get-namesmith-services";
import { initiateTrade } from "../../services/namesmith/workflows/trading/initiate-trade.workflow";
import { replyToInteraction } from "../../utilities/discord-action-utils";

const Parameters = Object.freeze({
	PLAYER_TRADING_WITH: new Parameter({
		type: ParameterTypes.USER,
		name: "player-trading-with",
		description: "The player to trade with",
	}),
	CHARACTERS_GIVING: new Parameter({
		type: ParameterTypes.STRING,
		name: "characters-giving",
		description: "The characters to give to the player you are trading with",
	}),
	CHARACTERS_RECEIVING: new Parameter({
		type: ParameterTypes.STRING,
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
	execute: async (interaction, {
		playerTradingWith,
		charactersGiving: offeredCharacters,
		charactersReceiving: requestedCharacters,
	}) => {
		const initiatingPlayerID = interaction.user.id;
		const recipientPlayerID = playerTradingWith.id;

		const tradeResult = initiateTrade({
			...getNamesmithServices(),
			initiatingPlayer: initiatingPlayerID,
			recipientPlayer: recipientPlayerID,
			offeredCharacters,
			requestedCharacters,
		});

		if (tradeResult.isInitatorNotAPlayer()) {
			return `You're not a player, so you can't initiate a trade.`;
		}
		else if (tradeResult.isRecipientNotAPlayer()) {
			return `You can only trade with players. <@${recipientPlayerID}> is not a player.`;
		}
		else if (tradeResult.isTradeBetweenSamePlayers()) {
			return `You can't trade with yourself.`;
		}
		else if (tradeResult.isMissingOfferedCharacters()) {
			const { missingCharacters } = tradeResult;
			return (
				`You are missing ${missingCharacters.length} characters you offered for this trade:\n` +
				missingCharacters
			);
		}
		else if (tradeResult.isMissingRequestedCharacters()) {
			const { missingCharacters } = tradeResult;

			return (
				`<@${recipientPlayerID}> is missing ${missingCharacters.length} characters you requested for this trade:\n` +
				missingCharacters
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