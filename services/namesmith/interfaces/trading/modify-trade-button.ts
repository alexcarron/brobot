import { ButtonInteraction, ButtonStyle } from "discord.js";
import { Trade } from "../../types/trade.types";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service";
import { handleTradeResponseResult } from "./trade-message";
import { checkIfPlayerCanModifyTrade } from "../../workflows/trading/modify-trade.workflow";
import { showModifyTradeModal } from "./modify-trade-modal";

/**
 * Creates a button that, when pressed, will modify a trade request.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to modify.
 * @returns An object containing the button's id, label, style, and a function to handle the button being pressed.
 */
export function createModifyTradeButton(
	{tradeService, playerService, trade}: {
		tradeService: TradeService,
		playerService: PlayerService,
		trade: Trade
	}
) {
	const { id } = trade;

	return {
		id: `trade-modify-${id}`,
		label: "Modify",
		style: ButtonStyle.Secondary,
		onButtonPressed: async (buttonInteraction: ButtonInteraction) => {
			const userID = buttonInteraction.user.id;
			let modifyCheckResult = checkIfPlayerCanModifyTrade({
				tradeService,
				playerService,
				trade,
				playerModifying: userID
			});

			const remainingResult = await handleTradeResponseResult({
				result: modifyCheckResult,
				buttonInteraction,
				responseType: 'modify'
			})

			if (remainingResult === null) return
			modifyCheckResult = remainingResult;

			trade = modifyCheckResult.trade;
			const {playerModifying, otherPlayer} = modifyCheckResult;

			await showModifyTradeModal({
				buttonInteraction,
				tradeService,
				playerService,
				trade,
				playerModifying,
				otherPlayer,
			});
		}
	}
}