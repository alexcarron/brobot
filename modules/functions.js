const { forever } = require("request");
const ids = require("../bot-config/discord-ids.js")
const { github_token } =  require("../token.json");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const functions = {

	// Function to calculate the GCD (Greatest Common Divisor) using the Euclidean algorithm
	gcd(num1, num2) {
		if (num2 === 0) {
				return num1;
		}
		return functions.gcd(num2, num1 % num2);
	},

	// Function to calculate the LCM (Least Common Multiple)
	lcm(num1, num2) {
		return (num1 * num2) / functions.gcd(num1, num2);
	},

	getChannelCategorys(guild) {
		return guild.channels.filter(
			(channel) => {
				return channel.type === "category";
			}
		);
	},

	

	async getCategoryChildren(guild, category_id) {
		let all_channels = await guild.channels.fetch();

		return await all_channels.filter(
			(channel) => {
				return channel.parentId == category_id && channel.type == 0
			}
		);
	},

	async getChannel(guild, channel_id) {
		return await guild.channels.fetch(channel_id);
	},

	async confirmAction({interaction, message, confirm_txt, cancel_txt, confirm_update_txt, cancel_update_txt}) {

		const confirm_button = new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel(confirm_txt)
			.setStyle(ButtonStyle.Success);

		const cancel_button = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel(cancel_txt)
			.setStyle(ButtonStyle.Secondary);

		const action_row = new ActionRowBuilder()
			.addComponents(cancel_button, confirm_button);

		confirmation_message = await interaction.editReply({
			content: message,
			components: [action_row],
		});

		const collectorFilter = other_interaction => other_interaction.user.id === interaction.user.id;

		try {
			const confirmation = await confirmation_message.awaitMessageComponent({ filter: collectorFilter, time: 120_000 });

			// * CONFIRM
			if (confirmation.customId === 'confirm') {
				console.log("confirmed")
				await confirmation.update({ content: `\`${confirm_update_txt}\``, components: [] });
				return true;
			// ! CANCEL
			} else if (confirmation.customId === 'cancel') {
				console.log("cancelled")
				await confirmation.update({ content: `\`${cancel_update_txt}\``, components: [] });
				return false;
			}
		}
		catch {
			interaction.editReply({ content: `\`Response not recieved in time\``, components: [] });
		}
	},

	async getMessage(channel, messsage_id) {
		return await channel.messages.fetch(messsage_id);
	},


	async getRDMGuild() {
		return await functions.getGuild(ids.rapid_discord_mafia.rdm_server_id);
	},

	async getGuild(guild_id) {
		return await global.client.guilds.fetch(guild_id);
	},

	/**
	 *
	 * @param {Guild} guild
	 * @param {string} user_id
	 * @returns {Promise<GuildMember>}
	 */
	async getGuildMember(guild, user_id) {
		return await guild.members.fetch(user_id);
	},

	async getUser(user_id) {
		return await global.client.users.fetch(user_id);
	},

	async getRole(guild, role_name) {
		let all_roles = await guild.roles.fetch();

		return await all_roles.find(role => role.name === role_name);
	},

	async getRoleById(guild, role_id) {
		return await guild.roles.fetch(role_id);
	},

	async addRole(guild_member, role) {
		await guild_member.roles.add(role).catch(console.error());
	},

	async removeRole(guild_member, role) {
		await guild_member.roles.remove(role).catch(console.error());
	},

	async setNickname(guild_member, nickname) {
		await guild_member.setNickname(nickname).catch(console.error());
	},

	async deferInteraction(interaction, message_content="Running command...") {
		if (interaction) {
			if (interaction.replied) {
				await interaction.followUp({
					content: message_content,
					ephemeral: true
				});
			}
			else if (interaction.deferred) {
				await interaction.editReply({
					content: message_content,
					ephemeral: true
				});
			}
			else {
				await interaction.deferReply({
					content: message_content,
					ephemeral: true
				});
			}
		}
	},

	async editReplyToInteraction(interaction, new_message) {
		if (interaction && (interaction.replied || interaction.deferred)) {
			return await interaction.editReply(new_message);
		}
	},

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

doesValueMatchType: function doesValueMatchType(value, type) {
		const isValueInRange = (value, range) => { return (value < range[0] || value > range[1]) };
		const isValueInList = (value, list) => { return list.includes(value) };
		const isValueFromClass = (value, class_name) => { return value.class == class_name };
		const doAllItemsMatchType = (array, type) => { return array.every(item => doesValueMatchType(item, type)) };

		if (typeof value !== type.base)
			return false;

		if (type.values && !isValueInList(value, type.values))
			return false;

		if (type.range && isValueInRange(value, type.range))
			return false;

		if (type.class && !isValueFromClass(value, type.class))
			return false;

		switch (type.subtype) {
			case "integer": {
				if (!Number.isInteger(value))
					return false;

				break;
			}

			case "array": {
				if (!Array.isArray(value)) {
					return false;
				}

				if (!doAllItemsMatchType(value, type.item_type)) {
					return false;
				}
			}
		}

		return true
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