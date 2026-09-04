import { ButtonInteraction, ModalSubmitInteraction } from "discord.js";
import { showModalWithTextInputs } from "../../../../utilities/discord-interfaces/discord-interface-utils";
import { Trade, TradeStatuses } from "../../types/trade.types";
import { Player } from "../../types/player.types";
import { modifyTrade } from "../../workflows/trading/modify-trade.workflow";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { sendTradeMessage } from "./trade-message";

export const MODIFY_TRADE_MODAL_TITLE_LABEL = "Modify this trade request";
export const GIVING_CHARACTERS_INPUT_LABEL = (
	{ otherPlayerName }: { otherPlayerName: string }
) => `Giving ${otherPlayerName}:`;
export const RECEIVING_CHARACTERS_INPUT_LABEL = (
	{ otherPlayerName }: { otherPlayerName: string }
) => `Getting from ${otherPlayerName}`;
export const NOT_A_PLAYER_MODIFY_FEEDBACK = `You're not a player, so you can't modify trades.`;
export const TRADE_DOES_NOT_EXIST_MODIFY_FEEDBACK = `You cannot modify a trade that does not exist.`;
export const TRADE_ALREADY_RESPONDED_TO_MODIFY_FEEDBACK = (
	{ tradeStatus }: { tradeStatus: string }
) => `You cannot modify a trade that has already been ${tradeStatus}.`;
export const TRADE_AWAITING_DIFFERENT_PLAYER_MODIFY_FEEDBACK = (
	{ playerAwaitingTradeID }: { playerAwaitingTradeID: string }
) => `This trade is awaiting a response from <@${playerAwaitingTradeID}>, so you cannot modify it.`;
export const MISSING_CHARACTERS_SELF_MODIFY_FEEDBACK = (
	{ missingCharacters }: { missingCharacters: string }
) => `You are missing ${missingCharacters.length} required characters for this trade\n${missingCharacters}`;
export const MISSING_CHARACTERS_OTHER_MODIFY_FEEDBACK = (
	{ playerID, missingCharacters }: { playerID: string, missingCharacters: string }
) => `<@${playerID}> is missing ${missingCharacters.length} required characters for this trade\n${missingCharacters}`;
export const TRADE_MODIFIED_FEEDBACK = (
	{ otherPlayerID }: { otherPlayerID: string }
) => `You modified <@${otherPlayerID}>'s trade request to the following trade.`;

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
	{buttonInteraction, trade, playerModifying, otherPlayer}: {
		buttonInteraction: ButtonInteraction,
		trade: Trade,
		playerModifying: Player,
    otherPlayer: Player,
	}
) {
	await showModalWithTextInputs({
		interaction: buttonInteraction,
		title: MODIFY_TRADE_MODAL_TITLE_LABEL,
		textInputs: [
			{
				id: "givenCharacters",
				label: GIVING_CHARACTERS_INPUT_LABEL({ otherPlayerName: otherPlayer.currentName }),
				initialValue: trade.status === TradeStatuses.AWAITING_RECIPIENT
					? trade.requestedCharacters
					: trade.offeredCharacters
			},
			{
				id: "receivedCharacters",
				label: RECEIVING_CHARACTERS_INPUT_LABEL({ otherPlayerName: otherPlayer.currentName }),
				initialValue: trade.status === TradeStatuses.AWAITING_RECIPIENT
					? trade.offeredCharacters
					: trade.requestedCharacters
			}
		],
		onModalSubmitted: async ({interaction, givenCharactersValue, receivedCharactersValue}) => {
			await onSubmitModifyTradeModal({
				modalSubmitInteraction: interaction,
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
	{modalSubmitInteraction, playerModifying, trade, charactersGiving, charactersReceiving}: {
		modalSubmitInteraction: ModalSubmitInteraction,
		playerModifying: Player,
		trade: Trade,
		charactersGiving: string,
		charactersReceiving: string
	}
) {
	const modifyResult = modifyTrade({playerModifying, trade, charactersGiving, charactersReceiving});

	if (modifyResult.isNotAPlayer()) {
		return await replyToInteraction(modalSubmitInteraction, NOT_A_PLAYER_MODIFY_FEEDBACK);
	}
	else if (modifyResult.isTradeDoesNotExist()) {
		return await replyToInteraction(modalSubmitInteraction, TRADE_DOES_NOT_EXIST_MODIFY_FEEDBACK);
	}
	else if (modifyResult.isTradeAlreadyRespondedTo()) {
		const { trade } = modifyResult;

		return await replyToInteraction(modalSubmitInteraction,
			TRADE_ALREADY_RESPONDED_TO_MODIFY_FEEDBACK({ tradeStatus: trade.status })
		);
	}
	else if (modifyResult.isTradeAwaitingDifferentPlayer()) {
		const { playerAwaitingTrade } = modifyResult;

		return await replyToInteraction(modalSubmitInteraction,
			TRADE_AWAITING_DIFFERENT_PLAYER_MODIFY_FEEDBACK({ playerAwaitingTradeID: playerAwaitingTrade.id })
		);
	}
	else if (modifyResult.isPlayerMissingCharacters()) {
		const { player, missingCharacters } = modifyResult;

		if (player.id === playerModifying.id) {
			return await replyToInteraction(modalSubmitInteraction,
				MISSING_CHARACTERS_SELF_MODIFY_FEEDBACK({ missingCharacters })
			);
		}
		else {
			return await replyToInteraction(modalSubmitInteraction,
				MISSING_CHARACTERS_OTHER_MODIFY_FEEDBACK({ playerID: player.id, missingCharacters })
			);
		}
	}

	trade = modifyResult.trade;
	const { otherPlayer } = modifyResult;

	await replyToInteraction(modalSubmitInteraction,
		TRADE_MODIFIED_FEEDBACK({ otherPlayerID: otherPlayer.id })
	);
	await sendTradeMessage({trade})
}