import { ButtonInteraction, ButtonStyle } from "discord.js";
import { Trade } from "../../types/trade.types";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { handleTradeResponseResult } from "./trade-message";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";

/**
 * Creates a button that, when pressed, will accept a trade request.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to accept.
 * @returns An object containing the button's id, label, style, and a function to handle the button being pressed.
 */
export function createAcceptTradeButton(
	{trade}: {
		trade: Trade
	}
) {
	const { id, initiatingPlayerID, recipientPlayerID } = trade;

	return {
		id: `trade-accept-${id}`,
		label: "Accept",
		style: ButtonStyle.Success,
		onButtonPressed: async (buttonInteraction: ButtonInteraction) => {
			const userID = buttonInteraction.user.id;
			let acceptResult = await acceptTrade({
				trade,
				playerAccepting: userID
			});

			const remainingResult = await handleTradeResponseResult({
				result: acceptResult,
				buttonInteraction,
				responseType: 'accept'
			})

			if (remainingResult === null) return
			acceptResult = remainingResult;

			if (acceptResult.isPlayerMissingCharacters()) {
				const { player, missingCharacters } = acceptResult;

				return await replyToInteraction(buttonInteraction,
					`<@${player.id}> no longer has ${missingCharacters.length} characters needed for this trade:\n` +
					missingCharacters
				);
			}

			trade = acceptResult.trade;

			await buttonInteraction.reply(
				`✅ This trade has been successfully executed\n` +
				`<@${initiatingPlayerID}> has received ${trade.requestedCharacters} from <@${recipientPlayerID}>\n` +
				`<@${recipientPlayerID}> has received ${trade.offeredCharacters} from <@${initiatingPlayerID}>`
			);
		}
	}
}