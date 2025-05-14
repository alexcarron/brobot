const { github_token } =  require("../token.json");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const functions = {
	async replyToInteraction(interaction, content) {
		try {
			await interaction.reply({
				content: content,
				components: [],
				ephemeral: true,
			});
		}
		catch {
			try {
				await interaction.followUp({
					content: content,
					components: [],
					ephemeral: true,
				});
			}
			catch {
				await interaction.channel.send({
					content: content,
					components: [],
					ephemeral: true,
				});
			}
		}
	},

	logColor(message, color) {
		let reset = "\x1b[0m",
			color_start;

		switch (color.toLowerCase()) {
			case "cyan":
				color_start = "\x1b[36m"
				break;

			case "red":
				color_start = "\x1b[31m"
				break;
		}

		console.log(color_start + message + reset);
	},

	/**
	 *
	 * @param {number} time_amount amount of time units waiting
	 * @param {string} unit Unit of time waiting (h, hour(s), m, min(s), minute(s), s, sec(s), second(s))
	 */
	wait(time_amount, unit = "ms") {
		let milliseconds = 0;

		switch (unit.toLowerCase()) {
			case "h":
			case "hour":
			case "hours":
				milliseconds = time_amount * 60 * 60 * 1000;
				break;

			case "m":
			case "min":
			case "mins":
			case "minute":
			case "minutes":
				milliseconds = time_amount * 60 * 1000;
				break;

			case "s":
			case "sec":
			case "secs":
			case "second":
			case "seconds":
				milliseconds = time_amount * 1000;
				break;

			default:
				milliseconds = time_amount;
				break;
		}

		return new Promise(
			resolve => setTimeout(resolve, Math.round(milliseconds))
		);
	},

	async saveObjectToGitHubJSON(object, json_name) {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = `${json_name}.json`,
			json_object_string = JSON.stringify(object);


		try {
			// Get the current file data to obtain sha
			const {data: current_file} =
				await axios.get(
					`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
					{
						headers: {
							'Authorization': `Token ${github_token}`
						}
					}
				);

			// Update the file content
			await axios.put(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					message: `Update ${json_name}`,
					content: new Buffer.from(json_object_string).toString(`base64`),
					sha: current_file.sha
				},
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			);
		}
		catch (error) {
			console.error(error);
		}
	},

	async getObjectFromGitHubJSON(json_name) {
		const
			axios = require('axios'),
			owner = "alexcarron",
			repo = "brobot-database",
			path = `${json_name}.json`;


		// Get the current file data
		const {data: file} =
			await axios.get(
				`https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
				{
					headers: {
						'Authorization': `Token ${github_token}`
					}
				}
			)
			.catch(err => {
				console.error(err);
			});


		let object_string = Buffer.from(file.content, 'base64').toString();
		let object = JSON.parse(object_string);

		return object;
	},

	/**
	 *
	 * @param {{channel_send}} param0
	 * @returns
	 */
	async getModalTextFieldInput({
		channel_sending_in,
		title="",
		button_text="",
		prompt="",
		placeholder="",
		confirmation_message="✅ Confirmed",
	}) {
		if (!channel_sending_in) return;

		const BUTTON_ID = button_text.replace(" ", "");
		const MODAL_ID = `${title.replace(" ", "")}Modal`;
		const TEXT_INPUT_ID = `${title.replace(" ", "")}TextInput`;

		const show_modal_button = new ButtonBuilder()
			.setCustomId(BUTTON_ID)
			.setLabel(button_text)
			.setStyle(ButtonStyle.Primary);

		const show_modal_button_action_row = new ActionRowBuilder()
			.addComponents(show_modal_button);

		const message_sent = await channel_sending_in.send({
			content: prompt,
			components: [show_modal_button_action_row],
		});

		const modal = new ModalBuilder()
			.setCustomId(MODAL_ID)
			.setTitle(title);

		// Create the text input components
		const text_input = new TextInputBuilder()
			.setCustomId(TEXT_INPUT_ID)
			.setLabel(title)
			.setMaxLength(1_900)
			.setPlaceholder(placeholder)
			.setValue(placeholder)
			.setRequired(true)
			.setStyle(TextInputStyle.Paragraph);

		const text_action_row = new ActionRowBuilder().addComponents(text_input);

		// Add inputs to the modal
		modal.addComponents(text_action_row);

		let confirmation_interaction;
		try {
			let hasPressedButton = false;
			let hasSubmittedModal = false;

			while (!hasSubmittedModal) {
				while (!hasPressedButton) {
					// Wait for button press
					confirmation_interaction = await message_sent.awaitMessageComponent({ time: 1_000_000 });
					if (confirmation_interaction.customId === BUTTON_ID)
						hasPressedButton = true;
				}

				await confirmation_interaction.showModal(modal);

				// Wait for button press
				confirmation_interaction = await message_sent.awaitMessageComponent({ time: 1_000_000 });
				if (confirmation_interaction.customId === MODAL_ID)
					hasSubmittedModal = true;
			}
		}
		catch {
			await message_sent.edit({ content: `\`Response not recieved in time\``, components: [] });
			return undefined;
		}

		// Get the data entered by the user
		const text_response = confirmation_interaction.fields.getTextInputValue(TEXT_INPUT_ID);

		const reply = await confirmation_interaction.reply("Confirmed");
		reply.delete();
		message_sent.delete();

		return text_response;
	},
}

module.exports = functions;