import { ButtonInteraction, ButtonStyle } from "discord.js";
import { Trade } from "../../types/trade.types";
import { handleTradeResponseResult } from "./trade-message";
import { declineTrade } from "../../workflows/trading/decline-trade.workflow";

/**
 * Creates a button that, when pressed, will decline a trade request.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to decline.
 * @returns An object containing the button's id, label, style, and a function to handle the button being pressed.
 */
export function createDeclineTradeButton(
	{trade}: {
		trade: Trade
	}
) {
	const { id } = trade;

	return {
		id: `trade-decline-${id}`,
		label: "Decline",
		style: ButtonStyle.Danger,
		onButtonPressed: async (buttonInteraction: ButtonInteraction) => {
			const userID = buttonInteraction.user.id;
			let declineResult = declineTrade({
				trade,
				playerDeclining: userID
			});


			const remainingResult = await handleTradeResponseResult({
				result: declineResult,
				buttonInteraction,
				responseType: 'decline'
			})

			if (remainingResult === null) return
			declineResult = remainingResult;

			trade = declineResult.trade;
			const {playerDeclined, playerDeclining} = declineResult;

			await buttonInteraction.reply(
				`❌ <@${playerDeclined.id}>, <@${playerDeclining.id}> has declined this trade`
			);
		}
	}
}