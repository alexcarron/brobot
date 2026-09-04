import { ButtonInteraction } from "discord.js";
import { ids } from "../../../../bot-config/discord-ids";
import { Trade } from "../../types/trade.types";
import { fetchNamesmithChannel } from "../../utilities/discord-fetch.utility";
import { replyToInteraction } from "../../../../utilities/discord/interaction-reply-utils";
import { createAcceptTradeButton } from "./accept-trade-button";
import { createModifyTradeButton } from "./modify-trade-button";
import { createDeclineTradeButton } from "./decline-trade-buttons";
import { attempt } from "../../../../utilities/error-utils";
import { checkIfPlayerCanModifyTrade } from "../../workflows/trading/modify-trade.workflow";
import { acceptTrade } from "../../workflows/trading/accept-trade.workflow";
import { declineTrade } from "../../workflows/trading/decline-trade.workflow";
import { DiscordButtons } from "../../../../utilities/discord-interfaces/discord-buttons";
import { getNamesmithServices } from "../../services/get-namesmith-services";
import { toDisplayedCharactersInline } from "../../utilities/player-message.utility";

export const TRADE_REQUEST_TEXT = (
	{ playerAwaitingResponseFromID, playerWaitingForResponseID, requestedCharacters, offeredCharacters }: {
		playerAwaitingResponseFromID: string,
		playerWaitingForResponseID: string,
		requestedCharacters: string,
		offeredCharacters: string,
	}
) =>
	`## <@${playerAwaitingResponseFromID}>, <@${playerWaitingForResponseID}> has requested the following trade:\n` +
	`**You give**\n> ${toDisplayedCharactersInline(requestedCharacters)}\n` +
	`**You receive**\n> ${toDisplayedCharactersInline(offeredCharacters)}`;
export const TRADE_RESPONSE_NOT_A_PLAYER_FEEDBACK = (
	{ responseType }: { responseType: 'accept' | 'decline' | 'modify' }
) => `You're not a player, so you can't ${responseType} a trade.`;
export const TRADE_RESPONSE_DOES_NOT_EXIST_FEEDBACK = (
	{ responseType }: { responseType: 'accept' | 'decline' | 'modify' }
) => `You can't ${responseType} a trade that does not exist`;
export const TRADE_RESPONSE_ALREADY_RESPONDED_TO_FEEDBACK = (
	{ responseType, tradeStatus }: { responseType: 'accept' | 'decline' | 'modify', tradeStatus: string }
) => `This trade is already ${tradeStatus} so you can't ${responseType} it.`;
export const TRADE_RESPONSE_AWAITING_DIFFERENT_PLAYER_FEEDBACK = (
	{ responseType, playerAwaitingTradeID }: { responseType: 'accept' | 'decline' | 'modify', playerAwaitingTradeID: string }
) => `This trade is awaiting <@${playerAwaitingTradeID}>'s response so you can't ${responseType} it.`;

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

	const messageContents = TRADE_REQUEST_TEXT({
		playerAwaitingResponseFromID: playerAwaitingResponseFrom.id,
		playerWaitingForResponseID: playerWaitingForResponse.id,
		requestedCharacters,
		offeredCharacters,
	});

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
		| { failureType: "notAPlayer" }
		| { failureType: "tradeDoesNotExist" }
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
	if (result.isNotAPlayer()) {
		await replyToInteraction(buttonInteraction,
			TRADE_RESPONSE_NOT_A_PLAYER_FEEDBACK({ responseType })
		);

		return null;
	}
	else if (result.isTradeDoesNotExist()) {
		await replyToInteraction(buttonInteraction,
			TRADE_RESPONSE_DOES_NOT_EXIST_FEEDBACK({ responseType })
		);
		return null;
	}
	else if (result.isTradeAlreadyRespondedTo()) {
		const { trade } = result;

		await replyToInteraction(buttonInteraction,
			TRADE_RESPONSE_ALREADY_RESPONDED_TO_FEEDBACK({ responseType, tradeStatus: trade.status })
		);
		return null;
	}
	else if (result.isTradeAwaitingDifferentPlayer()) {
		const { playerAwaitingTrade } = result;

		await replyToInteraction(buttonInteraction,
			TRADE_RESPONSE_AWAITING_DIFFERENT_PLAYER_FEEDBACK({ responseType, playerAwaitingTradeID: playerAwaitingTrade.id })
		);
		return null;
	}

	return result as RemainingResults;
}