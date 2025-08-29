import { Interaction, InteractionType, StringSelectMenuInteraction } from "discord.js";
import { eventHandlers, Handler } from "./event-listener-setup";

export function doOnMenuOptionSelected(
	doOnMenuOptionSelected: Handler<StringSelectMenuInteraction>
): void
export function doOnMenuOptionSelected(
	buttonID: string,
	doOnMenuOptionSelected: Handler<StringSelectMenuInteraction>
): void

/**
 * Adds an action to be completed when a button is pressed
 * @param idOrDoOnMenuOptionSelected - The action to be completed
 * @param maybeDoOnMenuOptionSelected - The action to be completed
 */
export function doOnMenuOptionSelected(
	idOrDoOnMenuOptionSelected:
		| string
		| Handler<StringSelectMenuInteraction>,
	maybeDoOnMenuOptionSelected?: Handler<StringSelectMenuInteraction>
): void {
	if (typeof idOrDoOnMenuOptionSelected === "string") {
		const selectMenuID = idOrDoOnMenuOptionSelected;
		const doOnButtonPressed = maybeDoOnMenuOptionSelected!;
		eventHandlers.onMenuOptionSelected.addHandlerForID(
			selectMenuID, doOnButtonPressed
		);
	}
	else {
		const doOnButtonPressed = idOrDoOnMenuOptionSelected;
		eventHandlers.onMenuOptionSelected.addHandler(doOnButtonPressed);
	}
}

/**
 * Checks if an interaction is a select menu option selection
 * @param interaction - The interaction to check
 * @returns Whether the interaction is a select menu option selection
 */
export const isMenuOptionSelectedEvent = (interaction: Interaction): interaction is StringSelectMenuInteraction =>
	interaction.type === InteractionType.MessageComponent && interaction.isStringSelectMenu();