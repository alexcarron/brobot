import { ButtonInteraction } from "discord.js";
import { ids } from "../../../../bot-config/discord-ids";
import { Trade } from "../../types/trade.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { replyToInteraction } from "../../../../utilities/discord-action-utils";
import { createAcceptTradeButton } from "./accept-trade-button";
import { createModifyTradeButton } from "./modify-trade-button";
import { createDeclineTradeButton } from "./decline-trade-buttons";
import { attempt } from "../../../../utilities/error-utils";
import { checkIfPlayerCanModifyTrade } from "../../workflows/trading/modify-trade.workflow";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { declineTrade } from "../../workflows/trading/decline-trade.workflow";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { getNamesmithServices } from "../../services/get-namesmith-services";

/**
 * Creates a new trade message with the given properties.
 * @param parameters - An object containing the parameters for the trade message.
 * @param parameters.tradeService - The trade service to use.
 * @param parameters.playerService - The player service to use.
 * @param parameters.trade - The trade to create a message for.
 * @returns A new trade message interface object.
 */
export function createTradeMessage(
	{trade}: {
		trade: Trade,
	}
): DiscordButtons {
	const { offeredCharacters, requestedCharacters } = trade;
	const { tradeService } = getNamesmithServices();

	const playerWaitingForResponse = tradeService.getPlayerWaitingForResponse(trade)!;
	const playerAwaitingResponseFrom = tradeService.getPlayerAwaitingResponseFrom(trade)!;

	const messageContents =
		`## <@${playerAwaitingResponseFrom.id}>, <@${playerWaitingForResponse.id}> has requested the following trade:\n` +
		`:arrow_right: **You give them** ${requestedCharacters}\n` +
		`:arrow_left: **You receive** ${offeredCharacters}\n\n`

	const acceptButton = createAcceptTradeButton({trade});
	const declineButton =  createDeclineTradeButton({trade})
	const modifyButton = createModifyTradeButton({trade})


	const tradeInterface = new DiscordButtons({
		promptText: messageContents,
		buttons: [
			acceptButton,
			declineButton,
			modifyButton
		]
	})

	return tradeInterface
}

/**
 * Sends a message to the trade channel with the trade details and an accept button.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to send.
 */
export async function sendTradeMessage(
	{trade}: {
		trade: Trade,
	}
) {
	const tradeChannel = await fetchNamesmithChannel(ids.namesmith.channels.TRADE_CHARACTERS);

	const tradeInterface = createTradeMessage({trade});

	await tradeInterface.sendIn(tradeChannel);
}

/**
 * Regenerates a trade message with the trade details and an accept button.
 * @param parameters - An object containing the following parameters:
 * @param parameters.tradeService - The trade service.
 * @param parameters.playerService - The player service.
 * @param parameters.trade - The trade to regenerate.
 */
async function regenerateTradeMessage(
	{trade}: {
		trade: Trade,
	}
) {
	const tradeChannel = await fetchNamesmithChannel(ids.namesmith.channels.TRADE_CHARACTERS);

	const tradeInterface = createTradeMessage({trade});

	await attempt(
		tradeInterface.regenerate({channel: tradeChannel})
	).ignoreError().execute();
}

/**
 * Regenerates all trade messages for every trade in the trade service.
 */
export async function regenerateAllTradeMessages() {
	const { tradeService } = getNamesmithServices();
	const trades = tradeService.getTrades();
	for (const trade of trades) {
		if (tradeService.hasBeenRespondedTo(trade)) continue;

		await regenerateTradeMessage({trade});
	}
}

/**
 * Handles the result of a trade response from a button press.
 *
 * If the result is an error, it will reply to the interaction with a message explaining why the trade could not be responded to.
 * If the result is not an error, it will return the result as is.
 * @param parameters An object containing the following parameters:
 * @param parameters.result The result of the trade response.
 * @param parameters.buttonInteraction The interaction that triggered this function.
 * @param parameters.responseType The type of response that was attempted.
 * @returns A promise that resolves to an object indicating whether the result was handled and, if not, the result itself.
 */
export async function handleTradeResponseResult<
	TradeWorkflowResult extends
		| Awaited<ReturnType<typeof acceptTrade>>
		| Awaited<ReturnType<typeof declineTrade>>
		| Awaited<ReturnType<typeof checkIfPlayerCanModifyTrade>>,

	RemainingResults extends TradeWorkflowResult =
		Exclude<TradeWorkflowResult,
		| { failureType: "nonPlayerRespondedToTrade" }
		| { failureType: "nonTradeRespondedTo" }
		| { failureType: "tradeAlreadyRespondedTo" }
		| { failureType: "tradeAwaitingDifferentPlayer" }
	>
>(
	{result, buttonInteraction, responseType}: {
		result: TradeWorkflowResult,
		buttonInteraction: ButtonInteraction,
		responseType: 'accept' | 'decline' | 'modify',
	}
): Promise<
	| null
	| RemainingResults
> {
	if (result.isNonPlayerRespondedToTrade()) {
		await replyToInteraction(buttonInteraction,
			`You're not a player, so you can't ${responseType} a trade.`
		);

		return null;
	}
	else if (result.isNonTradeRespondedTo()) {
		await replyToInteraction(buttonInteraction,
			`You can't ${responseType} a trade that does not exist`
		);
		return null;
	}
	else if (result.isTradeAlreadyRespondedTo()) {
		const { trade } = result;

		await replyToInteraction(buttonInteraction,
			`This trade is already ${trade.status} so you can't ${responseType} it.`
		);
		return null;
	}
	else if (result.isTradeAwaitingDifferentPlayer()) {
		const { playerAwaitingTrade } = result;

		await replyToInteraction(buttonInteraction,
			`This trade is awaiting <@${playerAwaitingTrade.id}>'s response so you can't ${responseType} it.`
		);
		return null;
	}

	return result as RemainingResults;
}