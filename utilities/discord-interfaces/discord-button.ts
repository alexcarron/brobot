import { ButtonInteraction, ButtonStyle, MessageCreateOptions } from "discord.js";
import { DiscordInterface } from "./discord-interface";
import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { doOnButtonPressed } from "../../event-listeners/on-button-pressed";

export type DiscordButtonDefinition = {
	id: string;
	label: string;
	style: ButtonStyle;
	onButtonPressed: (buttonInteraction: ButtonInteraction) => any;
}

/**
 * Represents an interface with a message and one button that can be created, sent to a channel, regenerated, and deleted.
 */
export class DiscordButton extends DiscordInterface {
	private promptText: string;
	private buttonLabel: string;
	private buttonStyle: ButtonStyle;
	private onButtonPressed: (buttonInteraction: ButtonInteraction) => any;

  constructor(
		{
			promptText,
			label: buttonLabel,
			style: buttonStyle = ButtonStyle.Primary,
			id: buttonID,
			onButtonPressed,
		}:
			& {promptText: string}
			& DiscordButtonDefinition
	) {
		super({
			id: buttonID
		});

    this.promptText = promptText;
    this.buttonLabel = buttonLabel;
    this.buttonStyle = buttonStyle;
		this.onButtonPressed = onButtonPressed;
  }

	getComponents(): {button: ButtonBuilder} {
		const button = new ButtonBuilder()
			.setCustomId(this.id)
			.setLabel(this.buttonLabel)
			.setStyle(this.buttonStyle);

		doOnButtonPressed(this.id, this.onButtonPressed);

		return {button};
	}

	getMessageContents(): MessageCreateOptions {
		const { button } = this.getComponents();

		return {
			content: this.promptText,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(button)
			]
		};
	}
}