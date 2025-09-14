import { ButtonInteraction, ButtonStyle } from "discord.js";
import { Trade } from "../../types/trade.types";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { PlayerService } from "../../services/player.service";
import { TradeService } from "../../services/trade.service";
import { handleTradeResponseResult } from "./trade-message";
import { MissingOfferedCharactersError, MissingRequestedCharactersError } from "../../utilities/error.utility";
import { getCharacterDifferencesInStrings } from "../../../../utilities/data-structure-utils";
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
	{tradeService, playerService, trade}: {
		tradeService: TradeService,
		playerService: PlayerService,
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
				tradeService,
				playerService,
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

			if (
				acceptResult instanceof MissingOfferedCharactersError ||
				acceptResult instanceof MissingRequestedCharactersError
			) {
				const characters =
					'offeredCharacters'	in acceptResult.relevantData
						? acceptResult.relevantData.offeredCharacters
						: acceptResult.relevantData.requestedCharacters;

				const { player } = acceptResult.relevantData;
				const { missingCharacters } = getCharacterDifferencesInStrings(characters, player.inventory);

				return await replyToInteraction(buttonInteraction,
					`<@${player.id}> no longer has ${missingCharacters.length} characters needed for this trade:\n` +
					missingCharacters.join('')
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