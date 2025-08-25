import { ButtonInteraction, Interaction, InteractionType } from "discord.js";
import { eventHandlers, Handler } from "./event-listener-setup";

export function onButtonPressed(
	doOnButtonPressed: Handler<ButtonInteraction>
): void
export function onButtonPressed(
	buttonID: string,
	doOnButtonPressed: Handler<ButtonInteraction>
): void

/**
 * Adds an action to be completed when a button is pressed
 * @param idOrDoOnButtonPressed - The action to be completed
 * @param maybeDoOnButtonPressed - The action to be completed
 */
export function onButtonPressed(
	idOrDoOnButtonPressed:
		| string
		| Handler<ButtonInteraction>,
	maybeDoOnButtonPressed?: Handler<ButtonInteraction>
): void {
	if (typeof idOrDoOnButtonPressed === "string") {
		const buttonID = idOrDoOnButtonPressed;
		const doOnButtonPressed = maybeDoOnButtonPressed!;
		eventHandlers.onButtonPressed.addHandlerForID(
			buttonID, doOnButtonPressed
		);
	}
	else {
		const doOnButtonPressed = idOrDoOnButtonPressed;
		eventHandlers.onButtonPressed.addHandler(doOnButtonPressed);
	}
}

/**
 * Checks if an interaction is a button press
 * @param interaction - The interaction to check
 * @returns Whether the interaction is a button press
 */
export const isButtonPressedEvent = (interaction: Interaction): interaction is ButtonInteraction =>
	interaction.type === InteractionType.MessageComponent &&
	interaction.isButton();