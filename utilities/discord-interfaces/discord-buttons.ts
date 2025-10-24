import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { InvalidArgumentError } from "../error-utils";
import { DiscordButtonDefinition } from "./discord-button";
import { DiscordInterface } from "./discord-interface";
import { doOnButtonPressed } from "../../event-listeners/on-button-pressed";
import { MessageCreateOptions } from "discord.js";


/**
 * Represents an interface of a single message with multiple buttons that can be created, sent to a channel, regenerated, and deleted.
 */
export class DiscordButtons extends DiscordInterface {
	private promptText: string;
	private buttons: Array<DiscordButtonDefinition>;

	constructor({
		promptText,
		buttons,
	}: {
		promptText: string;
		buttons: Array<DiscordButtonDefinition>;
	}) {
		if (buttons.length === 0)
			throw new InvalidArgumentError('DiscordButtons must have at least one button');

		super({
			id: buttons[0].id
		});

		this.promptText = promptText;
		this.buttons = buttons;
	}

	getComponents(): {buttons: Array<ButtonBuilder>} {
		const buttons = this.buttons.map(({id, label, style, onButtonPressed}) => {
			const button = new ButtonBuilder()
				.setCustomId(id)
				.setLabel(label)
				.setStyle(style);

			doOnButtonPressed(id, onButtonPressed);

			return button;
		});

		return {buttons};
	}

	getMessageContents(): MessageCreateOptions {
		const { buttons } = this.getComponents();

		return {
			content: this.promptText,
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					...buttons
				)
			]
		};
	}
}