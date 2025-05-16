const cron = require("cron");
const SlashCommand = require('../../../services/command-creation/slash-command.js');
const ids = require("../../../bot-config/discord-ids.js")
const { ChannelType, ButtonBuilder, ActionRowBuilder, ModalBuilder, ButtonStyle, TextInputBuilder, TextInputStyle, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, } = require('discord.js');
const { toTitleCase } = require("../../../utilities/text-formatting-utils.js");
const { toUnixTimestamp } = require("../../../utilities/date-time-utils.js");
const { confirmInteractionWithButtons } = require("../../../utilities/discord-action-utils.js");
const { wait } = require("../../../utilities/realtime-utils.js");
const { saveObjectToJsonInGitHub } = require("../../../utilities/github-json-storage-utils.js");
const Event = require("../../../services/discord-events/event.js");
const { LLPointTier } = require("../../../services/ll-points/ll-point-enums.js");

const command = new SlashCommand({
	name: "host-event",
	description: "Host your own custom event on your own",
});
command.allowsDMs = true;
command.execute = async function(interaction) {
	await interaction.deferReply({ ephemeral: true });

	await interaction.editReply("Loading...");

	if (interaction.channel.type !== ChannelType.DM)
		return await interaction.editReply("You may only use this command in my DMs.");

	const viewer = await global.LLPointManager.getViewerOrCreateViewer(interaction);
	const tier = viewer.getTier();
	if (tier === LLPointTier.VIEWER) {
		return await interaction.editReply("Sorry, you may only host your own events if you're an LL Fan! or higher");
	}

	if (
		!await confirmInteractionWithButtons({
			interaction,
			message:
				`Are you absolutely sure you want to host an event?\n` +
				`You will be responsible for\n` +
				`- Determining the rules of the event and how it will exactly play out\n` +
				`- Writing instructions for how to participate in the event\n` +
				`- Being present during the time you choose and hosting the event yourself`,
			confirmText: `I'm Sure`,
			cancelText: `I Don't Want To Host An Event`,
			confirmUpdateText: `Confirmed. You will now start the process of creating the event`,
			cancelUpdateText: `Canceled.`
		})
	) {
		return
	}

	/**
	 *
	 * @param {TextChannel} channel_sending_in
	 * @param {string} title Noun describing what your entering
	 * @param {string} short_question <45 character question to remind the user what to enter
	 * @param {string} long_question The prompt or question you want answered
	 * @param {string} placeholder The placeholder text for the answer
	 * @returns
	 */
	const getModalTextFieldInput = async function(channel_sending_in, title, short_question, long_question=undefined, placeholder="") {
		if (!long_question)
			long_question = short_question;

		const title_id = toTitleCase(title).replace(" ", "");

		const show_modal_button = new ButtonBuilder()
			.setCustomId(`Enter${title_id}`)
			.setLabel(`Enter ${title}`)
			.setStyle(ButtonStyle.Primary);

		const show_modal_button_action_row = new ActionRowBuilder()
			.addComponents(show_modal_button);

		const message_sent = await channel_sending_in.send({
			content: long_question,
			components: [show_modal_button_action_row],
		});

		const modal = new ModalBuilder()
			.setCustomId(`${title_id}Modal`)
			.setTitle(title_id);

		// Create the text input components
		const text_input = new TextInputBuilder()
			.setCustomId(`${title_id}TextInput`)
			.setLabel(short_question)
			.setMaxLength(1_900)
			.setPlaceholder(placeholder)
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
					if (confirmation_interaction.customId === `Enter${title_id}`)
						hasPressedButton = true;
				}

				await confirmation_interaction.showModal(modal);

				// Wait for button press
				confirmation_interaction = await message_sent.awaitMessageComponent({ time: 1_000_000 });
				if (confirmation_interaction.customId === `${title_id}Modal`)
					hasSubmittedModal = true;
			}
		}
		catch {
			await message_sent.edit({ content: `\`Response not recieved in time\``, components: [] });
			return undefined;
		}

		// Get the data entered by the user
		const text_response = confirmation_interaction.fields.getTextInputValue(`${title_id}TextInput`);
		await confirmation_interaction.reply(
			`# ✅ Confirmed ${title} ` + "\n" +
			">>> " + text_response
		);

		return text_response;
	}

	await wait({seconds: 1});

	const event_plan_text = await getModalTextFieldInput(
		interaction.channel,
		"Event Plan",
		"Step-by-step plan for event:",
		"First, determine an exact plan for what will happen in your event and what you will do. Give yourself step-by-step instructions. Make sure that the event is as simple as it can be while still being fun and around 1-3 hours long.",
		"- First step\n- Next step"
	)

	if (event_plan_text === undefined)
		return;

	await wait({seconds: 3});

	const event_instructions_text = await getModalTextFieldInput(
		interaction.channel,
		"Event Instuctions",
		"Instructions for how to participate in event:",
		"_ _\nNow, write down very simple, easy-to-follow instructions for how to participate in your event. Imagine someone who stumbles upon the event and doesn't know what to do needing to read these instructions. Include simple things like joining the VC, or connecting to a stream. Make sure it's not overly long or complicated.",
		"- First very simple, easy-to-follow instruction\n- Next instruction"
	)

	if (event_instructions_text === undefined)
		return;

	await wait({seconds: 3});

	const enticing_summary_text = await getModalTextFieldInput(
		interaction.channel,
		"Enticing Summary",
		"Enticing summary of event:",
		"_ _\nNow, create a 1-2 sentence enticing summary of the game to entice people to participate that also gives the reader a basic understanding of the game",
		"1-2 sentence enticing summary of event to entice people to participate"
	)

	if (enticing_summary_text === undefined)
		return;

	await wait({seconds: 2});

	const event_title_text = await getModalTextFieldInput(
		interaction.channel,
		"Event Title",
		"Fun title for event:",
		"_ _\nNow, create a short, fun title for your event",
		"Title of Your Event"
	)

	if (event_title_text === undefined)
		return;

	await wait({seconds: 1});

	const week_days = {
		"Monday": 1,
		"Tuesday": 2,
		"Wednesday": 3,
		"Thursday": 4,
		"Friday": 5,
		"Saturday": 6,
		"Sunday": 0,
	};
	const week_day_select_options = []
	for (let week_day of Object.keys(week_days)) {
		week_day_select_options.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(week_day)
				.setValue(week_day)
		);
	}
	const week_day_select_menu = new StringSelectMenuBuilder()
		.setCustomId('WeekDaySelectMenu')
		.setPlaceholder('Select week day to host event')
		.addOptions(
			...week_day_select_options
		);


	const time_select_options = [];
	for (let hour = 0; hour < 24; hour++) {
		let am_or_pm = hour < 12 ? "AM" : "PM";
		let twelve_hour = hour % 12;
		if (twelve_hour === 0) twelve_hour = 12;

		const time_name = `${twelve_hour}:00 ${am_or_pm}`;

		time_select_options.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(time_name)
				.setValue(hour.toString())
		);
	}
	const time_select_menu = new StringSelectMenuBuilder()
		.setCustomId('TimeSelectMenu')
		.setPlaceholder('Select time to host event (EST)')
		.addOptions(
			...time_select_options
		);

	const week_day_action_row = new ActionRowBuilder()
		.addComponents(week_day_select_menu);
	const time_action_row = new ActionRowBuilder()
		.addComponents(time_select_menu);

	const date_time_message_sent = await interaction.channel.send({
		content: '_ _\nSelect the date and time for your event in EST. (WARNING: The date and time you pick will be forced to be at least 24 hours after today. So if today is Tuesday 3PM and you choose Wednesday 2PM, the event will be 8 days from now)',
		components: [week_day_action_row, time_action_row],
	});

	let choseDay = false;
	let choseTime = false;
	let chosen_week_day, chosen_time;

	let date_time_confirmation_interaction;
	while (!(choseDay && choseTime)) {
		try {
			date_time_confirmation_interaction = await date_time_message_sent.awaitMessageComponent({ time: 120_000 });

			if (date_time_confirmation_interaction.customId === "WeekDaySelectMenu") {
				chosen_week_day = date_time_confirmation_interaction.values[0];
				choseDay = true;

				await date_time_confirmation_interaction.reply({
					content: `# ⤵️ Week Day Selected\n>>> ${chosen_week_day}`,
					ephemeral: true,
				});
			}

			if (date_time_confirmation_interaction.customId === "TimeSelectMenu") {
				chosen_time = parseInt(date_time_confirmation_interaction.values[0]);
				choseTime = true;

				let am_or_pm = chosen_time < 12 ? "AM" : "PM";
				let twelve_hour = chosen_time % 12;
				if (twelve_hour === 0) twelve_hour = 12;

				const time_name = `${twelve_hour}:00 ${am_or_pm}`;

				await date_time_confirmation_interaction.reply({
					content: `# ⤵️ Time Selected\n>>> ${time_name}`,
					ephemeral: true,
				});
			}
		}
		catch(error) {
			console.error(error);
			await date_time_message_sent.edit({ content: `\`Response not recieved in time\``, components: [] });
			return undefined;
		}
	}

	const event_date = new Date();
	const current_hour = event_date.getHours();
	event_date.setDate(event_date.getDate() + 1);
	event_date.setSeconds(0);
	event_date.setMinutes(0);
	event_date.setHours(chosen_time);

	const chosen_week_day_num = week_days[chosen_week_day];
	const day_after_today_week_day_num = event_date.getDay();
	let event_days_after_today = 0;

	let dateInFuture = false;
	if (chosen_week_day_num >= day_after_today_week_day_num) {
		if (chosen_week_day_num === day_after_today_week_day_num) {
			if (chosen_time > current_hour) {
				dateInFuture = true;
			}
		}
		else {
			dateInFuture = true;
		}
	}

	if (dateInFuture)
		event_days_after_today = chosen_week_day_num - day_after_today_week_day_num;
	else
		event_days_after_today = chosen_week_day_num + 7 - day_after_today_week_day_num;

	event_date.setDate(event_date.getDate() + event_days_after_today);
	const event_unix_timestamp = toUnixTimestamp(event_date);

	await interaction.channel.send(`# ✅ Date & Time Confirmed\n>>> <t:${event_unix_timestamp}:F> <t:${event_unix_timestamp}:R>`);

	await wait({seconds: 3});

	const ping_role_ids = {
		"...playing a game I invented": ids.ll_game_shows.roles.self_hosted_game,
		"...playing an existing game": ids.ll_game_shows.roles.game_night,
		"...watching something": ids.ll_game_shows.roles.watch_party,
		"...rating music": ids.ll_game_shows.roles.live_tune_tournament_event,
	};
	const ping_role_names = {
		"...playing a game I invented": "Self Hosted Games",
		"...playing an existing game": "Game Nights",
		"...watching something": "Watch Parties",
		"...rating music": "Live Tune Tournaments",
	};
	const ping_roles_select_options = []
	let i = 0
	for (const ping_role_name in ping_role_ids) {
		ping_roles_select_options.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(ping_role_name)
				.setValue(ping_role_name)
		);
	}

	const ping_role_select_menu = new StringSelectMenuBuilder()
		.setMinValues(0)
		.setMaxValues(Object.keys(ping_role_ids).length)
		.setCustomId('PingRoleSelectMenu')
		.setPlaceholder('My event involves...')
		.addOptions(
			...ping_roles_select_options
		);

	const confirm_ping_role_button = new ButtonBuilder()
		.setCustomId(`ConfirmPingRoles`)
		.setLabel(`Confirm`)
		.setStyle(ButtonStyle.Success);

	const ping_role_select_action_row = new ActionRowBuilder()
		.addComponents(ping_role_select_menu);

	const ping_role_confirm_action_row = new ActionRowBuilder()
		.addComponents(confirm_ping_role_button);

	const ping_role_message_sent = await interaction.channel.send({
		content: "_ _\nSelect all of the things you're event involves in order to determine which ping roles are used. You can choose multiple, but do NOT choose any options that aren't true.",
		components: [ping_role_select_action_row, ping_role_confirm_action_row],
	});

	let chosePingRoles = false;
	let chosen_ping_roles = [], chosen_ping_names = [];
	let ping_role_confirmation_interaction;
	while (!chosePingRoles) {
		try {
			ping_role_confirmation_interaction = await ping_role_message_sent.awaitMessageComponent({ time: 120_000 });

			if (ping_role_confirmation_interaction.customId === "PingRoleSelectMenu") {
				chosen_ping_roles = [];
				chosen_ping_names = [];
				for (const ping_role of ping_role_confirmation_interaction.values) {
					chosen_ping_roles.push(ping_role_ids[ping_role]);
					chosen_ping_names.push(ping_role_names[ping_role]);
				}

				const confimation_message = {
					content: `# ⤵️ Ping Roles Selected\n>>> - **${chosen_ping_names.join("**\n- **")}**`,
					ephemeral: true,
				};
				await ping_role_confirmation_interaction.reply(confimation_message);
			}
			else if (ping_role_confirmation_interaction.customId === "ConfirmPingRoles") {
				chosePingRoles = true;
				await ping_role_confirmation_interaction.reply({
					content: `# ✅ Ping Roles Selected`,
					ephemeral: true,
				});
			}
		}
		catch(error) {
			console.error(error);
			await ping_role_message_sent.edit({ content: `\`Response not recieved in time\``, components: [] });
			return undefined;
		}
	}
	chosen_ping_roles.push(ids.ll_game_shows.roles.all_discord_events);

	// event_instructions_text = "Instructions";
	// event_plan_text = "Plan";
	// enticing_summary_text = "Summary";
	// event_title_text = "Title";
	// event_unix_timestamp = 1706989356;

	const event = new Event({});
	event.instructions = event_instructions_text;
	event.plan = event_plan_text;
	event.summary = enticing_summary_text;
	event.name = event_title_text;
	event.time = event_unix_timestamp;
	event.host = viewer;
	event._ping_role_ids = chosen_ping_roles;

	global.events.push(event);
	await event.announceEvent();

	const event_warning_cron_job = new cron.CronJob(
		new Date((event.time - 60*10) * 1000),
		async function() {
			await event.announceEventWarning();
		},
	);
	event_warning_cron_job.start();

	const event_start_cron_job = new cron.CronJob(
		new Date((event.time + 60*5) * 1000),
		async function() {
			await event.announceEventStarting();
		},
	);
	event_start_cron_job.start();

	await saveObjectToJsonInGitHub({events: global.events}, "events");
	interaction.channel.send(`Event Confirmed!`);
}
module.exports = command;