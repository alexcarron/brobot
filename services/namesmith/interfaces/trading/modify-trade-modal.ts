import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { showModalWithTextInputs } from "../../../../utilities/discord-interface-utils";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { Player } from "../../types/player.types";
import { TradeService } from "../../services/trade.service";
import { PlayerService } from "../../services/player.service";
import { modifyTrade } from "../../workflows/trading/modify-trade.workflow";
import { MissingOfferedCharactersError, MissingRequestedCharactersError, NonPlayerRespondedToTradeError, NonTradeRespondedToError, TradeAlreadyRespondedToError, TradeAwaitingDifferentPlayerError } from "../../utilities/error.utility";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { getCharacterDifferencesInStrings as getCharacterDifferences } from "../../../../utilities/data-structure-utils";
import { sendTradeMessage } from "./trade-message";

/**
 * Shows a modal to modify a trade request.
 * @param parameters - An object containing the following parameters:
 * @param parameters.buttonInteraction - The interaction that triggered the modal.
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to modify.
 * @param parameters.playerModifying - The player who is modifying the trade.
 * @param parameters.otherPlayer - The player who is the recipient of the trade.
 */
export async function showModifyTradeModal(
	{buttonInteraction, tradeService, playerService, trade, playerModifying, otherPlayer}: {
		buttonInteraction: ButtonInteraction,
		tradeService: TradeService,
		playerService: PlayerService,
		trade: Trade,
		playerModifying: Player,
    otherPlayer: Player,
	}
) {
	await showModalWithTextInputs({
		interaction: buttonInteraction,
		title: "Modify this trade request",
		textInputs: [
			{
				id: "givenCharacters",
				label: `Giving ${otherPlayer.currentName}:`,
				initialValue: trade.status === TradeStatuses.AWAITING_RECIPIENT
					? trade.requestedCharacters
					: trade.offeredCharacters
			},
			{
				id: "receivedCharacters",
				label: `Getting from ${otherPlayer.currentName}`,
				initialValue: trade.status === TradeStatuses.AWAITING_RECIPIENT
					? trade.offeredCharacters
					: trade.requestedCharacters
			}
		],
		onModalSubmitted: async ({interaction, givenCharactersValue, receivedCharactersValue}) => {
			await onSubmitModifyTradeModal({
				modalSubmitInteraction: interaction,
				tradeService,
				playerService,
				playerModifying,
				trade,
				charactersGiving: givenCharactersValue,
				charactersReceiving: receivedCharactersValue,
			})
		}
	})
}

/**
 * Submits a modification to a trade request, updating the offered and requested characters.
 * @param parameters - An object containing the following parameters:
 * @param parameters.modalSubmitInteraction - The interaction that triggered the modal.
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.playerModifying - The player who is modifying the trade.
 * @param parameters.trade - The trade to modify.
 * @param parameters.charactersGiving - The new characters being offered in the trade.
 * @param parameters.charactersReceiving - The new characters being requested in the trade.
 * @returns A promise that resolves to void.
 */
async function onSubmitModifyTradeModal(
	{modalSubmitInteraction, tradeService, playerService, playerModifying, trade, charactersGiving, charactersReceiving}: {
		modalSubmitInteraction: ModalSubmitInteraction,
		tradeService: TradeService,
		playerService: PlayerService,
		playerModifying: Player,
		trade: Trade,
		charactersGiving: string,
		charactersReceiving: string
	}
) {
	const modifyResult = modifyTrade({tradeService, playerService, playerModifying, trade, charactersGiving, charactersReceiving});

	if (modifyResult instanceof NonPlayerRespondedToTradeError) {
		return await replyToInteraction(modalSubmitInteraction,
			`You're not a player, so you can't modify trades.`
		);
	}
	else if (modifyResult instanceof NonTradeRespondedToError) {
		return await replyToInteraction(modalSubmitInteraction,
			`You cannot modify a trade that does not exist.`
		);
	}
	else if (modifyResult instanceof TradeAlreadyRespondedToError) {
		const { trade } = modifyResult.relevantData;

		return await replyToInteraction(modalSubmitInteraction,
			`You cannot modify a trade that has already been ${trade.status}.`
		);
	}
	else if (modifyResult instanceof TradeAwaitingDifferentPlayerError) {
		const { playerAwaitingTrade } = modifyResult.relevantData;

		return await replyToInteraction(modalSubmitInteraction,
			`This trade is awaiting a response from <@${playerAwaitingTrade.id}>, so you cannot modify it.`
		);
	}
	else if (
		modifyResult instanceof MissingOfferedCharactersError ||
		modifyResult instanceof MissingRequestedCharactersError
	) {
		const characters =
			'offeredCharacters'	in modifyResult.relevantData
				? modifyResult.relevantData.offeredCharacters
				: modifyResult.relevantData.requestedCharacters;

		const { player } = modifyResult.relevantData;
		const { missingCharacters } = getCharacterDifferences(
			characters, player.inventory
		);

		if (player.id === playerModifying.id) {
			return await replyToInteraction(modalSubmitInteraction,
				`You are missing ${missingCharacters.length} required characters for this trade\n` +
				missingCharacters.join('')
			);
		}
		else {
			return await replyToInteraction(modalSubmitInteraction,
				`<@${player.id}> is missing ${missingCharacters.length} required characters for this trade\n` +
				missingCharacters.join('')
			);
		}
	}

	trade = modifyResult.trade;
	const { otherPlayer } = modifyResult;

	await replyToInteraction(modalSubmitInteraction,
		`You modified <@${otherPlayer.id}>'s trade request to the following trade.`
	);
	await sendTradeMessage({
		tradeService,
		playerService,
		trade
	})
}