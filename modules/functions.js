const { forever } = require("request");
const ids = require("../data/ids.json")
const { github_token } =  require("../token.json");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder, Guild, GuildMember, ModalBuilder, TextInputBuilder, TextInputStyle  } = require('discord.js');

const functions = {
	toTitleCase(string) {
		return string.replace(
			/\w\S*/g,
			function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			}
		);
	},

	changeAttrValue: function changeAttrValue(obj, ...properties) {
		let property = properties[0],
			value = properties.slice(-1)[0];

		properties = properties.slice(0, -1);

		if (properties.length <= 1) {
			obj[property] = value
			return obj;
		}

		if (!obj[property])
			obj[property] = {}

		changeAttrValue(
			obj[properties[0]],
			...properties.slice(1),
			value
		)
	},

	appendElementToNestedProperty: function pushItemToObj(element, object, ...nested_properties) {
		let top_level_property = nested_properties[0];

		console.log({element, object, nested_properties, top_level_property})

		// If element not being added to nested property
		if (nested_properties.length == 1) {
			if ( object[top_level_property] )
				object[top_level_property].push(element)
			else
				object[top_level_property] = [element]

			return object;
		}
		// If element being added to nested property
		else {
			if (object[top_level_property] === undefined)
				object[top_level_property] = {};
		}


		// Go one level deeper in the object
		pushItemToObj(
			element,
			object[top_level_property],
			...nested_properties.slice(1),
		)
	},

	shuffleArray(array) {
		let current_index = array.length,
			rand_index;

		// While there remain elementelements to shuffle.
		while (current_index != 0) {

			// Pick a remaining element.
			rand_index = Math.floor( Math.random() * current_index );
			current_index--;

			// And swap it with the current element.
			[ array[current_index], array[rand_index] ] =
				[ array[rand_index], array[current_index] ];
		}

		return array;
	},

	doArraysHaveSameElements(array1, array2) {
		const array2_elems_not_in_array1 = array2;

		if (array1.length !== array2.length)
			return false

		for (const element of array1) {
			const elem_index = array2_elems_not_in_array1.indexOf(element);

			if (elem_index !== -1) {
				array2_elems_not_in_array1.splice(elem_index, 1)
			}
			else {
				return false
			}
		}

		console.log({array2_elems_not_in_array1})

		if (array2_elems_not_in_array1.length > 0)
			return false
		else
			return true
	},

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

	/**
	 * Gets a random item from an array
	 * @template ElementType
	 * @param {ElementType[]} array An array you want a random element from
	 * @returns {ElementType | null | undefined} A random element in the passed array, null if empty, undefined if array not passed
	 */
	getRandArrayItem(array) {
		if (!Array.isArray(array)) return undefined;
		if (array.length === 0) return null;

		const rand_index = Math.floor( Math.random() * array.length )
		const rand_element = array[rand_index];
		return rand_element
	},

	getChannelCategorys(guild) {
		return guild.channels.filter(
			(channel) => {
				return channel.type === "category";
			}
		);
	},

	autocomplete(entry, valid_entries) {
		return valid_entries.find(valid_entry => valid_entry.toLowerCase().startsWith(entry.toLowerCase()));
	},

	getJSONFromObj: function getJSONFromObj(obj) {
		let json_obj = {};

		for (let property in obj) {
			if (property.startsWith("_") || property === "class")
				continue;

			if (typeof obj[property] === "object") {
				if (Array.isArray(obj[property]))
					json_obj[property] = Object.values( getJSONFromObj(obj[property]) );
				else
					json_obj[property] = getJSONFromObj(obj[property]);
			} else
				json_obj[property] = obj[property];
		}

		return json_obj;
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

	/**
	 * Create a text progress bar
	 * @param {Number} value - The value to fill the bar
	 * @param {Number} maxValue - The max value of the bar
	 * @param {Number} size - The bar size (in letters)
	 * @return {String} - The bar
	 */
	getProgressBar(value, maxValue, size) {
		const percentage = value / maxValue; // Calculate the percentage of the bar
		let progress = Math.round((size * percentage)); // Calculate the number of square caracters to fill the progress side.
		const emptyProgress = size - progress; // Calculate the number of dash caracters to fill the empty progress side.

		if (progress <= 0 || progress > size) progress = 0;

		const progressText = '▇'.repeat(progress); // Repeat is creating a string with progress * caracters in it
		const emptyProgressText = '—'.repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
		const percentageText = Math.round(percentage * 100) + '%'; // Displaying the percentage of the bar

		const bar = '```[' + progressText + emptyProgressText + ']' + percentageText + '```'; // Creating the bar
		return bar;
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

	/**
	 *
	 * @param {Date} date Date you want converted. Default is current date
	 * @returns Unix timestamp as integer
	 */
	getUnixTimestamp(date = new Date()) {
		return Math.round((date).getTime() / 1000);
	},

	getNextDayCronExpression() {
		const currentDate = new Date();
		console.log({currentDate});

		const nextDay = new Date(currentDate);
		// nextDay.setDate(currentDate.getDate() + 1);
		nextDay.setSeconds(currentDate.getSeconds() + 15);

		const seconds = nextDay.getSeconds();
		const minutes = nextDay.getMinutes();
		const hours = nextDay.getHours();
		const dayOfMonth = nextDay.getDate();
		const month = nextDay.getMonth(); // Starts at 0
		const dayOfWeek = nextDay.getDay();
		// const year = nextDay.getFullYear();

		const cronExpression = `${seconds} ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
		return cronExpression;
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

	addPropertyToObj: function(obj, property) {
		let doesValueMatchType = require("./functions.js");

		Object.defineProperty(
			obj,
			property.name,
			{
				get: function() { return this['_' + property.name] },
				set: function(new_value) {
						if (doesValueMatchType(new_value, property.type)) {
							this['_' + property.name] = new_value;
						}
						else {
							console.log({obj, property});
							console.log("Must match the following type:");
							console.log(property.type);
							throw new Error(`Invalid value for property ${property.name}: ${new_value}.`);
						}
					},
				enumerable: true,
				configurable: true,
			}
		);
	},

	generateRandomHexColorString: function() {
		const letters = '0123456789ABCDEF';
		let color = '';

		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}

		return color;
	},

	getRandomHexColorNumber: function() {
		const colorNumber = Math.floor(Math.random() * 16777216); // 16777216 = 0xFFFFFF + 1

		return colorNumber;
	},

	toOrdinal(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        throw new Error('Input is not a valid number');
    }

    if (number % 100 >= 11 && number % 100 <= 13) {
        return number + 'th';
    }

    switch (number % 10) {
        case 1:
            return number + 'st';
        case 2:
            return number + 'nd';
        case 3:
            return number + 'rd';
        default:
            return number + 'th';
    }
	},

	toWordOrdinal(number) {
    if (typeof number !== 'number' || isNaN(number)) {
        throw new Error('Input is not a valid number');
    }

    const ordinals = [
        'zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth',
        'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'
    ];

    const tensOrdinals = [
        '', 'tenth', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth'
    ];

    const tensNormal = [
        '', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', "hundred",
    ];

    if (number < 20) {
        return ordinals[number];
    }

    const lastDigit = number % 10;
    const tens = Math.floor(number / 10);

    if (lastDigit === 0) {
        return tensOrdinals[tens];
    }

    return tensNormal[tens] + '-' + ordinals[lastDigit];
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

	getSentenceFromArray(array) {
		if (!array || array.length <= 0)
			return ""

		if (array.length === 1)
			return `${array[0]}`;

		if (array.length === 2)
			return `${array[0]} and ${array[1]}`

		const non_last_elements = array.slice(0, -1);
		const last_element = array[array.length-1];
		return `${non_last_elements.join(", ")}, and ${last_element}`;
	},

	splitWithNoSplitWords(long_message, max_num_characters) {
		let messages = [];
		while (long_message.length > max_num_characters) {
			let split_message = long_message.substring(0, max_num_characters);

			let char_index = split_message.length;
			let char = long_message.charAt(char_index);
			while (char_index >= 0 && char !== ' ') {
				char_index -= 1;
				char = long_message.charAt(char_index);
			}

			split_message = split_message.substring(0, char_index);
			long_message = long_message.substring(char_index + 1);
			messages.push(split_message);
		}
		messages.push(long_message);

		return messages;
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

	removeLinks(input_string) {
    // Regular expression to match URLs
    var url_regex = /(https?:\/\/[^\s]+)/g;
    // Replace URLs with an empty string
    return input_string.replace(url_regex, '');
	},

	/**
	 * Removes emojis from a string
	 * @param {string} input_string - The string to remove emojis from
	 * @returns {string} The string with emojis removed
	 */
	removeEmojis(input_string) {
		return input_string.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '');
	}
}

module.exports = functions;